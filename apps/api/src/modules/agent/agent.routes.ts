/**
 * Agent Routes — Chat API for the OnboardingOpsAgent
 */
import { FastifyInstance } from 'fastify';
import { onboardingAgent } from '@ce/packages-mastra/agents';

// In-memory conversation history per session
// TODO: Replace with Redis or database in production
const sessions: Record<string, string[]> = {};

export async function agentRoutes(fastify: FastifyInstance) {
  // Send a message to the agent
  fastify.post('/agent/chat', async (request, reply) => {
    const { message, sessionId = 'default' } = request.body as {
      message: string;
      sessionId?: string;
    };
    if (!message) return reply.code(400).send({ error: 'Missing message' });

    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    sessions[sessionId].push(`User: ${message}`);
    const fullPrompt = sessions[sessionId].join('\n');

    try {
      const response = await onboardingAgent.generate(fullPrompt, { maxSteps: 10 });
      const replyText = response.text;

      sessions[sessionId].push(`Assistant: ${replyText}`);

      const toolsUsed =
        (response as any).steps
          ?.flatMap((s: any) => s.toolCalls || [])
          ?.map((tc: any) => tc.toolName || tc.id)
          ?.filter(Boolean) || [];

      reply.send({
        response: replyText,
        sessionId,
        toolsUsed,
        messageCount: sessions[sessionId].length,
      });
    } catch (err: any) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Agent error', details: err.message });
    }
  });

  // Clear conversation history
  fastify.delete('/agent/chat/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    delete sessions[sessionId];
    reply.send({ cleared: true, sessionId });
  });
}
