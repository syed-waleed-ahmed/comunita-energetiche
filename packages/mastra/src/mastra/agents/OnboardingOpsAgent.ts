/**
 * OnboardingOpsAgent — Mastra-powered LLM Agent for Comunità Energetiche
 *
 * This is a real Mastra agent backed by OpenAI GPT-4o.
 * It uses 9 modular tools and runs as a self-contained monolith
 * with native database access and AI extraction.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import {
    memberSearchTool,
    registerMemberTool,
    checklistTool,
    validateMemberTool,
    extractDocumentTool,
    listDocumentsTool,
    updateMemberFieldTool,
    generateTracciatoTool,
    extractLocalFileTool,
} from '../../tools/index';
import { ONBOARDING_AGENT_SYSTEM_PROMPT } from '../../agentSystemPrompt';

const pgMemory = new PostgresStore({
    id: 'comunita-energy-db',
    connectionString: process.env.DATABASE_URL as string,
});

export const onboardingAgent = new Agent({
    id: 'onboarding-ops-agent',
    name: 'OnboardingOpsAgent',
    instructions: ONBOARDING_AGENT_SYSTEM_PROMPT,
    model: 'openai/gpt-4o',
    // @ts-ignore — private field typing mismatch across monorepo workspaces
    memory: new Memory({ storage: pgMemory }),
    tools: {
        memberSearchTool,
        registerMemberTool,
        checklistTool,
        validateMemberTool,
        extractDocumentTool,
        listDocumentsTool,
        updateMemberFieldTool,
        generateTracciatoTool,
        extractLocalFileTool,
    },
});
