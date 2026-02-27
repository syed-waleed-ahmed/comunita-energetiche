import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import 'dotenv/config';

async function main() {
    const agent = new Agent({
        id: 'test-agent',
        name: 'Test',
        instructions: 'You are a test agent',
        model: 'google/gemini-1.5-flash'
    });

    console.log('Sending message to google/gemini-1.5-flash via Mastra...');
    try {
        const response = await agent.generate('Hello, are you there?');
        console.log('Success:', response.text);
    } catch (error: any) {
        console.error('Mastra Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

main().catch(console.error);
