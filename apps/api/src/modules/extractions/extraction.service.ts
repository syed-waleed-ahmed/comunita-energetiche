/**
 * Extraction Service — Business logic for document data extraction
 */
import { prisma } from '@ce/db';
import { DocumentExtractor, DocType, getExtractionSchema, getExtractableDocTypes } from '@ce/packages-core';

const extractor = new DocumentExtractor();

export class ExtractionService {
  async runExtraction(documentId: string, schemaName?: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    }

    const docType = (schemaName || doc.docType) as DocType;
    const result = await extractor.extract(doc.storagePath, docType);

    const extraction = await prisma.extractionResult.create({
      data: {
        documentId: doc.id,
        schemaName: docType,
        json: result.fields,
        confidence: result.confidence,
        evidence: result.evidence || {},
      },
    });

    const status = result.extractable ? 'DONE' : 'NOT_EXTRACTABLE';
    await prisma.document.update({
      where: { id: doc.id },
      data: { extractionStatus: status },
    });

    return { extraction, needsReview: result.needsReview, extractable: result.extractable };
  }

  getSchemas() {
    const extractable = getExtractableDocTypes();
    return extractable.map((docType) => {
      const schema = getExtractionSchema(docType);
      return {
        docType,
        fields: schema ? Object.keys(schema.shape) : [],
      };
    });
  }
}

export const extractionService = new ExtractionService();
