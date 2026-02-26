/**
 * Mastra Instance — Entry point for Mastra Studio
 *
 * This file exports the configured Mastra instance that registers
 * the OnboardingOpsAgent. Run `npx mastra dev` to start Studio
 * at http://localhost:4111
 */

import { Mastra } from '@mastra/core';
import { onboardingAgent } from './agents/OnboardingOpsAgent';

export const mastra = new Mastra({
    agents: {
        onboardingAgent,
    },
});
