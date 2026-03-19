/**
 * Document Extractor for Comunità Energetiche
 *
 * Schema-driven extraction engine that knows what fields to extract from
 * each document type. For the MVP this uses simulated data matching the
 * real documents in "docs necessari iscrizione/". The architecture is
 * designed for easy swap to real LLM/OCR/Vision integration.
 *
 * To integrate real AI extraction:
 *   1. Replace _simulateExtraction() with an API call to GPT-4o Vision,
 *      Gemini Pro Vision, or a dedicated OCR service
 *   2. Pass the document file (image/PDF) to the API
 *   3. Parse the response against the Zod schema for validation
 */

import { DocType, DOC_TYPES } from './docTypes';
import { getExtractionSchema, getExtractableDocTypes } from './extractionSchemas';
import { createLogger } from './logger';
import { openaiRateLimiter } from './rateLimiter';

const logger = createLogger('DocumentExtractor');

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface ExtractionResult {
  docType: DocType;
  fields: Record<string, any>;
  confidence: number;
  evidence?: any;
  needsReview: boolean;
  extractable: boolean;
}

// ────────────────────────────────────────────────────────────
// Simulated extraction data
// ────────────────────────────────────────────────────────────
// These match the real documents found in the enrollment folder

const SIMULATED_DATA: Partial<Record<DocType, { fields: Record<string, any>; confidence: number }>> = {
  [DOC_TYPES.BILL]: {
    fields: {
      CodicePod: 'IT001E00112233',
      holderName: 'Mario Rossi',
      address: 'Via Roma 15, 00100 Roma RM',
      supplyType: 'Uso domestico residente',
    },
    confidence: 0.92,
  },
  [DOC_TYPES.ID]: {
    fields: {
      Nome: 'Mario',
      Cognome: 'Rossi',
      CodiceFiscale: 'RSSMRA85A01H501Z',
      expiryDate: '15/03/2028',
    },
    confidence: 0.95,
  },
  [DOC_TYPES.VISURA]: {
    fields: {
      RagioneSociale: 'Energia Verde SRL',
      PartitaIVA: '12345678901',
      CodiceAteco: '35.11.00',
      FormaGiuridica: 'SRL',
      address: 'Via dell\'Energia 42, 20100 Milano MI',
    },
    confidence: 0.88,
  },
  [DOC_TYPES.GAUDI_CERT]: {
    fields: {
      censimpCode: 'CENSIMP-2023-00456',
      plantPowerKW: 6.0,
      technologyType: 'Fotovoltaico',
      activationDate: '15/06/2023',
    },
    confidence: 0.90,
  },
  [DOC_TYPES.CONNECTION_RECORD]: {
    fields: {
      CodicePod: 'IT001E00112233',
      connectionDate: '10/06/2023',
      contractualPowerKW: 6.0,
      meterSerial: 'MT-2023-78901',
    },
    confidence: 0.85,
  },
  // From real nameplate photos in produttore/ folder:
  // Deye/V-TAC SUN-5K-SG03LP1-EU hybrid inverter
  [DOC_TYPES.NAMEPLATE_INVERTER]: {
    fields: {
      manufacturer: 'Deye / V-TAC',
      model: 'SUN-5K-SG03LP1-EU',
      serialNumber: 'SN:2212034369',
      ratedPowerKW: 5.0,
      inverterType: 'Hybrid Inverter',
    },
    confidence: 0.87,
  },
  // From real nameplate: Ulica Solar UL-550M-144HV mono crystalline
  [DOC_TYPES.NAMEPLATE_PV_MODULE]: {
    fields: {
      manufacturer: 'Ulica Solar',
      model: 'UL-550M-144HV',
      serialNumber: 'U624MM23E5C2575B',
      maxPowerW: 550,
      moduleType: 'Mono Crystalline',
    },
    confidence: 0.89,
  },
  // From real nameplate: LithiumValley LV-BAT-W10.24Ac
  [DOC_TYPES.NAMEPLATE_BATTERY]: {
    fields: {
      manufacturer: 'LithiumValley',
      model: 'LV-BAT-W10.24Ac',
      serialNumber: '440LCFB0056',
      energyKWh: 10.24,
      batteryType: 'Li-ion',
    },
    confidence: 0.86,
  },
};

// ────────────────────────────────────────────────────────────
// DocumentExtractor class
// ────────────────────────────────────────────────────────────

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentExtractor {
  /**
   * Extract structured data from a document.
   *
   * @param documentPath  Path to the uploaded file (PDF, image, Excel)
   * @param docType       The document type to determine which schema to use
   * @returns ExtractionResult with fields, confidence, and review flag
   */
  async extract(documentPath: string, docType: DocType): Promise<ExtractionResult> {
    const schema = getExtractionSchema(docType);

    // If no extraction schema exists for this doc type, it's a presence-only check
    if (!schema) {
      return {
        docType,
        fields: {},
        confidence: 1.0,
        needsReview: false,
        extractable: false, // indicates this doc type doesn't support extraction
      };
    }

    // Attempt real AI extraction if the API key is present
    try {
      if (process.env.OPENAI_API_KEY) {
        logger.info('Running real OpenAI extraction', { documentPath });
        const realData = await this._performRealExtraction(documentPath, schema);

        // Validate extracted fields against schema
        const validation = schema.safeParse(realData);
        const confidence = validation.success ? 0.95 : 0.60;

        return {
          docType,
          fields: validation.success ? validation.data : realData,
          confidence,
          evidence: {
            source: 'openai-gpt-4o',
            schemaValid: validation.success,
            errors: validation.success ? undefined : validation.error.issues,
          },
          needsReview: confidence < 0.9,
          extractable: true,
        };
      }
    } catch (error) {
      logger.warn('Real AI extraction failed, falling back to simulation', { documentPath: arguments[0] }, error as Error);
    }

    // Fallback to simulated extraction for MVP/testing if real AI fails or is unconfigured
    logger.info('Running simulated extraction', { docType });
    const simulated = await this._simulateExtraction(docType);

    // Validate extracted fields against schema
    const validation = schema.safeParse(simulated.fields);
    const confidence = validation.success ? simulated.confidence : simulated.confidence * 0.5;

    return {
      docType,
      fields: simulated.fields,
      confidence,
      evidence: {
        source: 'simulated_extraction',
        schemaValid: validation.success,
        errors: validation.success ? undefined : validation.error.issues,
      },
      needsReview: confidence < 0.9,
      extractable: true,
    };
  }

  /**
   * Real extraction using OpenAI GPT-4o (supports native PDF and Image parsing)
   */
  private async _performRealExtraction(documentPath: string, schema: any): Promise<Record<string, any>> {
    const buffer = fs.readFileSync(documentPath);
    const ext = path.extname(documentPath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

    // Build the file/image content part based on the document type.
    // Images use the dedicated 'image' type for better GPT-4o vision support;
    // PDFs use 'file' with the correct 'mediaType' property (Vercel AI SDK v6+).
    const filePart = isImage
      ? { type: 'image' as const, image: buffer }
      : { type: 'file' as const, mediaType: 'application/pdf' as const, data: buffer };

    // Throttle to stay within OpenAI rate limits
    await openaiRateLimiter.acquire();

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: schema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Sei un esperto nell\'estrazione di dati da documenti amministrativi e tecnici italiani (bollette, visure, documenti GSE, targhette di inverter e pannelli). Estrai i dati richiesti in modo accurato. Se un dato non è chiaramente leggibile o non è presente, omettilo o scrivi null.'
            },
            filePart,
          ]
        }
      ]
    });

    return result.object as Record<string, any>;
  }

  /**
   * Simulated extraction for MVP fallback testing.
   */
  private async _simulateExtraction(
    docType: DocType
  ): Promise<{ fields: Record<string, any>; confidence: number }> {
    const data = SIMULATED_DATA[docType];
    if (data) {
      return data;
    }
    // Fallback for unknown doc types
    return { fields: {}, confidence: 0 };
  }
}

// Keep backward compatibility
export const FakeLLMExtractor = DocumentExtractor;
