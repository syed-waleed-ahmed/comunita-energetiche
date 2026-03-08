/**
 * Validation Service — Business logic for member validation
 */
import { prisma } from '@ce/db';
import { validateTracciatoRow, crossValidateMember } from '@ce/packages-core';

export class ValidationService {
  async validateMember(memberId: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw Object.assign(new Error('Member not found'), { statusCode: 404 });
    }

    // Step 1: Row-level validation
    const rowIssues = validateTracciatoRow({ ...member });

    // Step 2: Cross-document validation
    const documents = await prisma.document.findMany({
      where: { memberId },
      include: { extractionResults: true },
    });

    const extractions: Record<string, Record<string, any>> = {};
    for (const doc of documents) {
      if (doc.extractionResults.length > 0) {
        const latest = doc.extractionResults.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        extractions[doc.docType] = latest.json as Record<string, any>;
      }
    }

    const crossIssues = crossValidateMember({ member: member as any, extractions });

    // Persist issues
    const allIssues = [...rowIssues, ...crossIssues];
    await prisma.validationIssue.deleteMany({ where: { memberId } });

    if (allIssues.length > 0) {
      await prisma.validationIssue.createMany({
        data: allIssues.map((issue) => ({
          memberId,
          severity: issue.severity,
          code: issue.code,
          message: issue.message,
          field: issue.field,
          source: issue.source,
        })),
      });
    }

    return {
      rowValidation: { issueCount: rowIssues.length, issues: rowIssues },
      crossValidation: { issueCount: crossIssues.length, issues: crossIssues },
      totalIssues: allIssues.length,
    };
  }
}

export const validationService = new ValidationService();
