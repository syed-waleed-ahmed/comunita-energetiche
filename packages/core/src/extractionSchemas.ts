/**
 * Extraction Schemas for Comunità Energetiche Documents
 *
 * Each schema defines the fields that should be extracted from a specific
 * document type using OCR/Vision AI. These map directly to the real documents
 * in "docs necessari iscrizione/".
 *
 * For MVP, these schemas drive the simulated extraction. When integrating
 * a real LLM (GPT-4o Vision, Gemini Pro Vision, etc.), these same schemas
 * define the expected output format.
 */

import { z } from 'zod';
import { DocType, DOC_TYPES } from './docTypes';

// ────────────────────────────────────────────────────────────
// Extraction schemas per document type
// ────────────────────────────────────────────────────────────

/** Bolletta (utility bill) → extracts POD code and holder info */
export const BillExtractionSchema = z.object({
    CodicePod: z.string().describe('POD code (Point of Delivery), e.g. IT001E0000000001'),
    holderName: z.string().describe('Name of the account holder'),
    address: z.string().optional().describe('Supply address'),
    supplyType: z.string().optional().describe('Type of electricity supply'),
});

/** Carta d'identità → extracts personal identification */
export const IdExtractionSchema = z.object({
    Nome: z.string().describe('First name'),
    Cognome: z.string().describe('Last name / surname'),
    CodiceFiscale: z.string().describe('Italian fiscal code (16 alphanumeric characters)'),
    expiryDate: z.string().optional().describe('Document expiry date (DD/MM/YYYY)'),
});

/** Visura camerale → extracts company registration info */
export const VisuraExtractionSchema = z.object({
    RagioneSociale: z.string().describe('Company name / business name'),
    PartitaIVA: z.string().describe('VAT number (11 digits)'),
    CodiceAteco: z.string().optional().describe('ATECO activity code (format: XX.XX.XX)'),
    FormaGiuridica: z.string().optional().describe('Legal form (SRL, SPA, etc.)'),
    address: z.string().optional().describe('Registered office address'),
});

/** Certificato GAUDÌ → extracts generation unit registry data */
export const GaudiCertExtractionSchema = z.object({
    censimpCode: z.string().describe('CENSIMP code from Terna\'s GAUDÌ registry'),
    plantPowerKW: z.number().describe('Declared plant power in kW'),
    technologyType: z.string().optional().describe('Technology type (e.g. fotovoltaico)'),
    activationDate: z.string().optional().describe('Plant activation date (DD/MM/YYYY)'),
});

/** Verbale di allaccio (grid connection record) → extracts connection info */
export const ConnectionRecordExtractionSchema = z.object({
    CodicePod: z.string().describe('POD code confirmed by grid operator'),
    connectionDate: z.string().optional().describe('Grid connection date (DD/MM/YYYY)'),
    contractualPowerKW: z.number().optional().describe('Contracted power in kW'),
    meterSerial: z.string().optional().describe('Electricity meter serial number'),
});

/** Targhetta inverter (nameplate photo) → extracts via Vision AI */
export const NameplateInverterExtractionSchema = z.object({
    manufacturer: z.string().describe('Inverter manufacturer (e.g. Huawei, Deye)'),
    model: z.string().describe('Model number (e.g. SUN2000-6KTL-M1)'),
    serialNumber: z.string().describe('Serial number from nameplate'),
    ratedPowerKW: z.number().describe('Rated output power in kW'),
    inverterType: z.string().optional().describe('Inverter type (string, hybrid, micro)'),
});

/** Targhetta modulo FV (PV module nameplate photo) → extracts via Vision AI */
export const NameplatePVModuleExtractionSchema = z.object({
    manufacturer: z.string().describe('Module manufacturer (e.g. Ulica Solar, Viessmann)'),
    model: z.string().describe('Module model (e.g. UL-550M-144HV)'),
    serialNumber: z.string().describe('Serial number from nameplate barcode'),
    maxPowerW: z.number().describe('Maximum power in Watts (Pmax / Wp)'),
    moduleType: z.string().optional().describe('Module type (Mono Crystalline, Poly, etc.)'),
});

/** Targhetta accumulo (battery nameplate photo) → extracts via Vision AI */
export const NameplateBatteryExtractionSchema = z.object({
    manufacturer: z.string().describe('Battery manufacturer (e.g. Huawei, LithiumValley)'),
    model: z.string().describe('Model number (e.g. LUNA2000-7-E1)'),
    serialNumber: z.string().describe('Serial number from nameplate'),
    energyKWh: z.number().describe('Rated energy capacity in kWh'),
    batteryType: z.string().optional().describe('Battery chemistry (Li-ion, LFP, etc.)'),
});

// ────────────────────────────────────────────────────────────
// Schema registry — maps DocType to its extraction schema
// ────────────────────────────────────────────────────────────

export const EXTRACTION_SCHEMA_MAP: Partial<Record<DocType, z.ZodObject<any>>> = {
    [DOC_TYPES.BILL]: BillExtractionSchema,
    [DOC_TYPES.ID]: IdExtractionSchema,
    [DOC_TYPES.VISURA]: VisuraExtractionSchema,
    [DOC_TYPES.GAUDI_CERT]: GaudiCertExtractionSchema,
    [DOC_TYPES.CONNECTION_RECORD]: ConnectionRecordExtractionSchema,
    [DOC_TYPES.NAMEPLATE_INVERTER]: NameplateInverterExtractionSchema,
    [DOC_TYPES.NAMEPLATE_PV_MODULE]: NameplatePVModuleExtractionSchema,
    [DOC_TYPES.NAMEPLATE_BATTERY]: NameplateBatteryExtractionSchema,
};

/**
 * Get the extraction schema for a given document type.
 * Returns undefined for document types that don't have structured extraction
 * (e.g. SINGLE_LINE_DIAGRAM, DILA — these are checked for presence only).
 */
export function getExtractionSchema(docType: DocType): z.ZodObject<any> | undefined {
    return EXTRACTION_SCHEMA_MAP[docType];
}

/**
 * Returns a list of document types that support data extraction.
 */
export function getExtractableDocTypes(): DocType[] {
    return Object.keys(EXTRACTION_SCHEMA_MAP) as DocType[];
}
