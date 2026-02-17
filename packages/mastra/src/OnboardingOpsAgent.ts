import { member_search, checklist_check, validate_member, generate_tracciato } from './tools';

export async function OnboardingOpsAgent(input: { memberIdentifier?: string }) {
  let memberId = input.memberIdentifier;
  let member;
  if (!memberId) {
    // 1. Ask for identifier (simulate prompt)
    throw new Error('Please provide a member identifier (name, CF, POD, VAT)');
  }
  // 2. Search
  const matches = await member_search(memberId);
  if (!matches.length) return { message: 'No member found.' };
  member = matches[0];
  // 3. Checklist
  const checklist = await checklist_check(member.id);
  // 4. Validate
  const validation = await validate_member(member.id);
  // 5. Optionally trigger tracciato
  // (for demo, not auto-triggered)
  return {
    member,
    checklist,
    validation,
    nextSteps: [
      'Upload missing documents if any',
      'Resolve validation issues',
      'When READY_FOR_TRACCIATO, generate tracciato batch',
    ],
  };
}
