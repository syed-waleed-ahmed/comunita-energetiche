import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Seed script for Comunità Energetiche development database.
 *
 * Creates two test members:
 *   1. Mario Rossi — a CONSUMER (persona fisica) with basic documents
 *   2. Energia Verde SRL — a PRODUCER (persona giuridica) with full technical docs
 *
 * Document records reference the real sample files in "docs necessari iscrizione/".
 */
async function main() {
  // ── Path to sample documents ──
  const docsRoot = path.resolve(__dirname, '../../docs necessari iscrizione');
  const consumatoreDir = path.join(docsRoot, 'consumatore');
  const produttoreDir = path.join(docsRoot, 'produttore');

  // ═══════════════════════════════════════════════════════════
  // CONSUMER: Mario Rossi (persona fisica)
  // ═══════════════════════════════════════════════════════════
  let consumer = await prisma.member.findFirst({ where: { fiscalCode: 'RSSMRA85A01H501Z' } });
  if (!consumer) {
    consumer = await prisma.member.create({
      data: {
        name: 'Mario',
        surname: 'Rossi',
        fiscalCode: 'RSSMRA85A01H501Z',
        vatNumber: null,
        legalType: 'PF',
        subjectType: 'PI',
        podCode: 'IT001E00112233',
        memberType: 'CONSUMER',
        status: 'DRAFT',
      },
    });
    console.log('✅ Seeded CONSUMER member:', consumer.name, consumer.surname);

    // Upload consumer documents
    const consumerDocs = [
      { docType: 'ID', storagePath: path.join(consumatoreDir, 'carta identità leg rapp.pdf'), mimeType: 'application/pdf' },
      { docType: 'BILL', storagePath: path.join(consumatoreDir, 'bolletta.pdf'), mimeType: 'application/pdf' },
      { docType: 'VISURA', storagePath: path.join(consumatoreDir, 'Visura.pdf'), mimeType: 'application/pdf' },
    ];
    for (const doc of consumerDocs) {
      await prisma.document.create({
        data: {
          memberId: consumer.id,
          docType: doc.docType,
          storagePath: doc.storagePath,
          mimeType: doc.mimeType,
          extractionStatus: 'PENDING',
        },
      });
    }
    console.log(`   📄 Created ${consumerDocs.length} document records for consumer`);
  } else {
    console.log('⏩ Consumer member already exists:', consumer.name, consumer.surname);
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCER: Energia Verde SRL (persona giuridica)
  // ═══════════════════════════════════════════════════════════
  let producer = await prisma.member.findFirst({ where: { fiscalCode: 'NRGVRD90B15F205X' } });
  if (!producer) {
    producer = await prisma.member.create({
      data: {
        name: 'Giovanni',
        surname: 'Bianchi',
        fiscalCode: 'NRGVRD90B15F205X',
        vatNumber: '12345678901',
        legalType: 'PG',
        subjectType: 'PI',
        podCode: 'IT001E00998877',
        memberType: 'PRODUCER',
        censimpCode: 'CENSIMP-2023-00456',
        plantPowerKW: 6.0,
        installedCapacityKW: 5.5,
        hasStorage: true,
        dataAttivazione: '15/03/2023',
        ragioneSociale: 'Energia Verde SRL',
        formaGiuridica: 'SRL',
        codiceAteco: '35.11.00',
        accumuloStandalone: 'NO',
        status: 'DRAFT',
      },
    });
    console.log('✅ Seeded PRODUCER member:', producer.name, producer.surname, '(Energia Verde SRL)');

    // Upload producer documents (all required docs + nameplates)
    const producerDocs = [
      { docType: 'ID', storagePath: path.join(consumatoreDir, 'carta identità leg rapp.pdf'), mimeType: 'application/pdf' },
      { docType: 'BILL', storagePath: path.join(consumatoreDir, 'bolletta.pdf'), mimeType: 'application/pdf' },
      { docType: 'VISURA', storagePath: path.join(consumatoreDir, 'Visura.pdf'), mimeType: 'application/pdf' },
      { docType: 'DILA', storagePath: path.join(produttoreDir, '20230221 2 - DILA.pdf'), mimeType: 'application/pdf' },
      { docType: 'RDE', storagePath: path.join(produttoreDir, 'RDE.pdf'), mimeType: 'application/pdf' },
      { docType: 'GAUDI_CERT', storagePath: path.join(produttoreDir, 'cert_gaudi.pdf'), mimeType: 'application/pdf' },
      { docType: 'CONNECTION_RECORD', storagePath: path.join(produttoreDir, 'VERBALE ALLACCIO ENEL.PDF'), mimeType: 'application/pdf' },
      { docType: 'SINGLE_LINE_DIAGRAM', storagePath: path.join(produttoreDir, 'SCHEMA ELETTRICO UNIFILARE con accumulo.pdf'), mimeType: 'application/pdf' },
      { docType: 'PV_SERIAL_LIST', storagePath: path.join(produttoreDir, '_elenco_numeri_serie_ftv.xlsx'), mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { docType: 'NAMEPLATE_INVERTER', storagePath: path.join(produttoreDir, 'Targhetta Inverter.JPG'), mimeType: 'image/jpeg' },
      { docType: 'NAMEPLATE_PV_MODULE', storagePath: path.join(produttoreDir, 'FOTO TARGHETTA MODULO FV.jpeg'), mimeType: 'image/jpeg' },
      { docType: 'NAMEPLATE_BATTERY', storagePath: path.join(produttoreDir, 'FOTO TARGHETTA ACCUMULO.jpeg'), mimeType: 'image/jpeg' },
    ];
    for (const doc of producerDocs) {
      await prisma.document.create({
        data: {
          memberId: producer.id,
          docType: doc.docType,
          storagePath: doc.storagePath,
          mimeType: doc.mimeType,
          extractionStatus: 'PENDING',
        },
      });
    }
    console.log(`   📄 Created ${producerDocs.length} document records for producer`);
  } else {
    console.log('⏩ Producer member already exists:', producer.name, producer.surname);
  }

  console.log('\n📊 Summary:');
  const totalMembers = await prisma.member.count();
  const totalDocs = await prisma.document.count();
  console.log(`   Members: ${totalMembers}`);
  console.log(`   Documents: ${totalDocs}`);
}

main()
  .then(() => {
    console.log('\n✅ Seed complete!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
