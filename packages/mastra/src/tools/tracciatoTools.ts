/**
 * Tracciato Tools — GSE CSV Generation
 */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateTracciatoCSV, memberToTracciatoRow } from '@ce/packages-core';
import fs from 'fs';
import path from 'path';

// ────────────────────────────────────────────────────────────
// Tool: Generate Tracciato
// ────────────────────────────────────────────────────────────
export const generateTracciatoTool = createTool({
    id: 'generate-tracciato',
    description: 'Generate a Tracciato CSV batch for GSE portal submission.',
    inputSchema: z.object({ memberIds: z.array(z.string()).optional() }),
    outputSchema: z.any(),
    execute: async (inputData: any) => {
        const where = inputData.memberIds
            ? { id: { in: inputData.memberIds } }
            : { status: 'READY_FOR_TRACCIATO' };
        const members = await prisma.member.findMany({ where });
        if (!members.length) throw new Error('No eligible members');

        const batch = await prisma.tracciatoBatch.create({
            data: { status: 'PENDING', rowCount: members.length },
        });

        for (const member of members) {
            const dataJson = memberToTracciatoRow(member as any);
            await prisma.tracciatoRow.create({
                data: {
                    batchId: batch.id,
                    memberId: member.id,
                    podCode: member.podCode || '',
                    dataJson,
                    isValid: true,
                },
            });
        }

        const batchFull = await prisma.tracciatoBatch.findUnique({
            where: { id: batch.id },
            include: { rows: true },
        });
        const csv = generateTracciatoCSV(
            batchFull!.rows.map((r: any) => r.dataJson),
            ';'
        );
        const filePath = path.join(process.cwd(), 'tracciato', `${batch.id}.csv`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, csv);

        await prisma.fileArtifact.create({
            data: { batchId: batch.id, type: 'CSV', storagePath: filePath },
        });
        await prisma.tracciatoBatch.update({
            where: { id: batch.id },
            data: { status: 'GENERATED' },
        });

        return { file: filePath, batchId: batch.id };
    },
});
