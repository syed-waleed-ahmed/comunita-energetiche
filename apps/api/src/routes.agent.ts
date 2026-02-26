/**
 * Chat API Route for the OnboardingOpsAgent
 *
 * POST /agent/chat — send a message to the LLM-powered agent
 * The agent uses tools to interact with the backend and responds
 * in natural language.
 */

import { FastifyInstance } from 'fastify';
import { onboardingAgent } from '../../../packages/mastra/src/mastra/agents/OnboardingOpsAgent';

// In-memory conversation history per session
// In production, use Redis or a database
const sessions: Record<string, string[]> = {};

export async function agentRoutes(fastify: FastifyInstance) {
    // POST /agent/chat — send a message to the agent
    fastify.post('/agent/chat', {
        preHandler: [apiKeyAuth],
        handler: async (request, reply) => {
            const { message, sessionId = 'default' } = request.body as {
                message: string;
                sessionId?: string;
            };
            if (!message) return reply.code(400).send({ error: 'Missing message' });

            // Initialize session if needed
            if (!sessions[sessionId]) {
                sessions[sessionId] = [];
            }

            // Add user message to context
            sessions[sessionId].push(`User: ${message}`);
            const fullPrompt = sessions[sessionId].join('\n');

            try {
                // Call the Mastra agent with conversation context
                const response = await onboardingAgent.generate(fullPrompt, {
                    maxSteps: 10,
                });

                const replyText = response.text;

                // Track assistant response
                sessions[sessionId].push(`Assistant: ${replyText}`);

                // Extract tool calls info for transparency
                const toolsUsed = (response as any).steps
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
                reply.code(500).send({
                    error: 'Agent error',
                    details: err.message,
                });
            }
        },
    });

    // DELETE /agent/chat/:sessionId — clear conversation history
    fastify.delete('/agent/chat/:sessionId', {
        preHandler: [apiKeyAuth],
        handler: async (request, reply) => {
            const { sessionId } = request.params as { sessionId: string };
            delete sessions[sessionId];
            reply.send({ cleared: true, sessionId });
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
