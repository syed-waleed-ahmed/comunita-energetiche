/**
 * Document Tools — Extract, List, Upload & Extract
 */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { extractor } from '../lib/extractor';
import { DocType } from '../../../core/src/docTypes';
import path from 'path';

// ────────────────────────────────────────────────────────────
// Tool: Run Document Extraction
// ────────────────────────────────────────────────────────────
export const extractDocumentTool = createTool({
    id: 'extract-document',
    description: 'Extract structured data from an existing document UUID.',
    inputSchema: z.object({ documentId: z.string() }),
    outputSchema: z.any(),
    execute: async (inputData: any) => {
        const doc = await prisma.document.findUnique({ where: { id: inputData.documentId } });
        if (!doc) throw new Error('Document not found');

        const result = await extractor.extract(doc.storagePath, doc.docType as DocType);

        const extraction = await prisma.extractionResult.create({
            data: {
                documentId: doc.id,
                schemaName: doc.docType,
                json: result.fields,
                confidence: result.confidence,
                evidence: result.evidence || {},
            },
        });

        await prisma.document.update({
            where: { id: doc.id },
            data: { extractionStatus: result.extractable ? 'DONE' : 'NOT_EXTRACTABLE' },
        });

        return { extraction, needsReview: result.needsReview, extractable: result.extractable };
    },
});

// ────────────────────────────────────────────────────────────
// Tool: List Member Documents
// ────────────────────────────────────────────────────────────
export const listDocumentsTool = createTool({
    id: 'list-documents',
    description: 'List all documents uploaded for a specific member.',
    inputSchema: z.object({ memberId: z.string() }),
    outputSchema: z.any(),
    execute: async (inputData: any) => {
        const documents = await prisma.document.findMany({ where: { memberId: inputData.memberId } });
        return { documents, count: documents.length };
    },
});

// ────────────────────────────────────────────────────────────
// Tool: Extract Directly Uploaded File (Studio UI Drag & Drop)
// ────────────────────────────────────────────────────────────
export const extractLocalFileTool = createTool({
    id: 'extract-local-file',
    description: 'Extract data from a file that the user uploaded directly into the chat.',
    inputSchema: z.object({
        filePath: z.string(),
        docType: z.string(),
        memberId: z.string().optional(),
    }),
    outputSchema: z.any(),
    execute: async (inputData: any) => {
        const memberId = inputData.memberId || '00000000-0000-0000-0000-000000000000';
        const docType = (inputData.docType as DocType) || 'BILL';
        const ext = path.extname(inputData.filePath).toLowerCase();

        let mimeType = 'application/pdf';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';

        const doc = await prisma.document.create({
            data: {
                memberId,
                docType,
                storagePath: inputData.filePath,
                mimeType,
                extractionStatus: 'PENDING',
            },
        });

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

        await prisma.document.update({
            where: { id: doc.id },
            data: { extractionStatus: result.extractable ? 'DONE' : 'NOT_EXTRACTABLE' },
        });

        return {
            documentId: doc.id,
            extraction,
            needsReview: result.needsReview,
            extractable: result.extractable,
        };
    },
});
