import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { generateTracciatoCSV, TRACCIATO_COLUMNS } from '../../../packages/core/src/tracciato';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function tracciatoRoutes(fastify: FastifyInstance) {
  // POST /tracciato/batches
  fastify.post('/tracciato/batches', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { memberIds } = request.body as { memberIds?: string[] };
      // Find eligible members (READY_FOR_TRACCIATO)
      const where = memberIds ? { id: { in: memberIds } } : { status: 'READY_FOR_TRACCIATO' };
      const members = await prisma.member.findMany({ where });
      if (!members.length) return reply.code(400).send({ error: 'No eligible members' });
      // Create batch
      const batch = await prisma.tracciatoBatch.create({
        data: {
          status: 'PENDING',
          rowCount: members.length,
        },
      });
      // Create rows
      for (const member of members) {
        const dataJson: any = {};
        for (const col of TRACCIATO_COLUMNS) dataJson[col] = (member as any)[col] || '';
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
      reply.send({ batchId: batch.id });
    },
  });

  // POST /tracciato/batches/:id/generate
  fastify.post('/tracciato/batches/:id/generate', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const batch = await prisma.tracciatoBatch.findUnique({ where: { id }, include: { rows: true } });
      if (!batch) return reply.code(404).send({ error: 'Batch not found' });
      // Generate CSV
      const delimiter = process.env.CSV_DELIMITER || ';';
      const csv = generateTracciatoCSV(batch.rows.map(r => r.dataJson), delimiter);
      // Store file artifact (local for MVP)
      const filePath = path.join(process.cwd(), 'tracciato', `${batch.id}.csv`);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, csv);
      await prisma.fileArtifact.create({
        data: {
          batchId: batch.id,
          type: 'CSV',
          storagePath: filePath,
        },
      });
      await prisma.tracciatoBatch.update({ where: { id }, data: { status: 'GENERATED' } });
      reply.send({ file: filePath });
    },
  });

  // GET /tracciato/batches/:id/download?type=csv
  fastify.get('/tracciato/batches/:id/download', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { type } = request.query as { type?: string };
      const artifact = await prisma.fileArtifact.findFirst({ where: { batchId: id, type: (type || 'CSV').toUpperCase() } });
      if (!artifact) return reply.code(404).send({ error: 'File not found' });
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${id}.csv"`);
      const stream = fs.createReadStream(artifact.storagePath);
      return reply.send(stream);
    },
  });
}

function apiKeyAuth(request: any, reply: any, done: any) {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.default_x_api_key) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  done();
}
