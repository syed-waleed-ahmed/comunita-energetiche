import { OnboardingOpsAgent } from './OnboardingOpsAgent';

async function main() {
  // Example: run agent with a member identifier
  try {
    const result = await OnboardingOpsAgent({ memberIdentifier: 'test' });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
  }
}

main();
