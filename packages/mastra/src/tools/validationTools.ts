/**
 * Validation Tools — Checklist, Cross-Validation
 */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { DocType } from '../../../core/src/docTypes';
import { buildChecklist, checkChecklistComplete } from '../../../core/src/checklistConfig';
import { validateTracciatoRow } from '../../../core/src/validation';
import { crossValidateMember } from '../../../core/src/crossValidation';

// ────────────────────────────────────────────────────────────
// Tool: Check Document Checklist
// ────────────────────────────────────────────────────────────
export const checklistTool = createTool({
    id: 'checklist-check',
    description: 'Check the document checklist for a member. Returns which documents are required, received, and still missing.',
    inputSchema: z.object({
        memberId: z.string().describe('The member UUID'),
    }),
    outputSchema: z.object({
        memberType: z.string(),
        checklist: z.array(z.any()),
        complete: z.boolean(),
        missingRequired: z.array(z.any()),
    }),
    execute: async (inputData: any) => {
        const member = await prisma.member.findUnique({
            where: { id: inputData.memberId },
            include: { documents: true },
        });
        if (!member) throw new Error('Member not found');

        const memberType = (member.memberType as 'CONSUMER' | 'PRODUCER') || 'CONSUMER';
        const uploadedDocTypes = member.documents.map((d: any) => d.docType as DocType);
        const checklist = buildChecklist(memberType, uploadedDocTypes);
        const { complete, missingDocs } = checkChecklistComplete(memberType, uploadedDocTypes);

        return { memberType, checklist, complete, missingRequired: missingDocs };
    },
});

// ────────────────────────────────────────────────────────────
// Tool: Validate Member
// ────────────────────────────────────────────────────────────
export const validateMemberTool = createTool({
    id: 'validate-member',
    description: 'Run row-level field validation and cross-document consistency checks on a member.',
    inputSchema: z.object({
        memberId: z.string().describe('The member UUID'),
    }),
    outputSchema: z.object({
        rowValidation: z.any(),
        crossValidation: z.any(),
        totalIssues: z.number(),
    }),
    execute: async (inputData: any) => {
        const member = await prisma.member.findUnique({
            where: { id: inputData.memberId },
            include: { documents: { include: { extractionResults: true } } },
        });
        if (!member) throw new Error('Member not found');

        // Step 1: Row validation
        const rowValidation = validateTracciatoRow({ ...member });

        // Step 2: Cross-document validation
        const extractions: Record<string, Record<string, any>> = {};
        for (const doc of (member as any).documents || []) {
            const results = doc.extractionResults || [];
            if (results.length > 0) {
                const latest = results.sort(
                    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];
                extractions[doc.docType] = latest.json as Record<string, any>;
            }
        }
        const crossValidation = crossValidateMember({ member: member as any, extractions });

        // Persist issues
        await prisma.validationIssue.deleteMany({ where: { memberId: member.id } });
        const allIssues = [...rowValidation, ...crossValidation];
        if (allIssues.length > 0) {
            await prisma.validationIssue.createMany({
                data: allIssues.map(issue => ({
                    memberId: member.id,
                    code: issue.code,
                    message: issue.message,
                    field: issue.field,
                    severity: issue.severity,
                    source: issue.source,
                })),
            });
        }

        // Update status
        const hasErrors = allIssues.some(i => i.severity === 'ERROR');
        await prisma.member.update({
            where: { id: member.id },
            data: { status: hasErrors ? 'VALIDATION_ERROR' : 'READY_FOR_TRACCIATO' },
        });

        return { rowValidation, crossValidation, totalIssues: allIssues.length };
    },
});
