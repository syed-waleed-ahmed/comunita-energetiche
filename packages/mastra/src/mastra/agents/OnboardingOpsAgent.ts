/**
 * OnboardingOpsAgent — Mastra-powered LLM Agent for Comunità Energetiche
 *
 * This is a real Mastra agent backed by an LLM (OpenAI GPT-4o-mini).
 * It uses 7 tools to interact with the backend API and can have
 * natural conversations about member onboarding.
 */

import { Agent } from '@mastra/core/agent';
import {
    memberSearchTool,
    checklistTool,
    validateMemberTool,
    extractDocumentTool,
    listDocumentsTool,
    updateMemberFieldTool,
    generateTracciatoTool,
} from '../../tools';
import { ONBOARDING_AGENT_SYSTEM_PROMPT } from '../../agentSystemPrompt';

export const onboardingAgent = new Agent({
    id: 'onboarding-ops-agent',
    name: 'OnboardingOpsAgent',
    instructions: ONBOARDING_AGENT_SYSTEM_PROMPT,
    model: 'openai/gpt-4o-mini',
    tools: {
        memberSearchTool,
        checklistTool,
        validateMemberTool,
        extractDocumentTool,
        listDocumentsTool,
        updateMemberFieldTool,
        generateTracciatoTool,
    },
});
