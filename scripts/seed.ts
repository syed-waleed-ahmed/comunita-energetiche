import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed a fake member for testing
  const existing = await prisma.member.findFirst({ where: { fiscalCode: 'FAKEMBR01A01H501Z' } });
  let member;
  if (existing) {
    member = existing;
    console.log('Member already exists:', member);
  } else {
    member = await prisma.member.create({
      data: {
        name: 'Mario',
        surname: 'Rossi',
        fiscalCode: 'FAKEMBR01A01H501Z',
        vatNumber: '12345678901',
        legalType: 'PF',
        subjectType: 'AI',
        podCode: 'IT001E0000000001',
        status: 'DRAFT',
      },
    });
    console.log('Seeded member:', member);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
