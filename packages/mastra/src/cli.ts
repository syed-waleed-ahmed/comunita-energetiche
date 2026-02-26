/**
 * Interactive CLI for the OnboardingOpsAgent
 *
 * Usage:
 *   pnpm agent:chat     (from monorepo root)
 *   npx tsx packages/mastra/src/cli.ts
 *
 * Provides an interactive terminal where you can chat with the agent.
 * The agent uses the LLM to understand your questions and decides
 * which backend tools to call.
 *
 * ⚠️ Make sure the API server is running on localhost:3000 first!
 */

import * as readline from 'readline';
import { onboardingAgent } from './mastra/agents/OnboardingOpsAgent';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const conversationHistory: string[] = [];

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  🤖 OnboardingOpsAgent — Comunità Energetiche   ║');
console.log('║  Type your question or command. Type "exit" to   ║');
console.log('║  quit. Make sure the API is running on :3000!    ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

function prompt() {
    rl.question('You: ', async (input) => {
        const trimmed = input.trim();
        if (!trimmed) { prompt(); return; }
        if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) {
            console.log('\n👋 Goodbye!');
            rl.close();
            process.exit(0);
        }

        conversationHistory.push(`User: ${trimmed}`);
        const fullPrompt = conversationHistory.join('\n');

        try {
            console.log('\n🔄 Thinking...\n');
            const response = await onboardingAgent.generate(fullPrompt, { maxSteps: 10 });
            const reply = response.text;
            console.log(`Agent: ${reply}\n`);
            conversationHistory.push(`Assistant: ${reply}`);
        } catch (err: any) {
            console.error(`\n❌ Error: ${err.message}\n`);
            if (err.message?.includes('API key') || err.message?.includes('401')) {
                console.error('💡 Make sure OPENAI_API_KEY is set in your .env file');
            }
        }

        prompt();
    });
}

prompt();
