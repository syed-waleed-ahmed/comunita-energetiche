// pages/api/agent.ts
// Next.js API route to call OnboardingOpsAgent
import type { NextApiRequest, NextApiResponse } from 'next';
// Adjust the import path as needed for your monorepo setup
import { OnboardingOpsAgent } from '../../../packages/mastra/src/OnboardingOpsAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const result = await OnboardingOpsAgent(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Agent error' });
  }
}
