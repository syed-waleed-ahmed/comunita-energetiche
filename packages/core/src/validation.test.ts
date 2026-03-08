import { validateTracciatoRow, ValidationIssue } from '../src/validation';
import { crossValidateMember } from '../src/crossValidation';
import { getRequiredDocs, buildChecklist, checkChecklistComplete } from '../src/checklistConfig';
import { DocumentExtractor } from '../src/extractor';
import { getExtractionSchema, getExtractableDocTypes } from '../src/extractionSchemas';
import { DOC_TYPES } from '../src/docTypes';

// ═══════════════════════════════════════════════════════════
// 1. ROW VALIDATION TESTS (original + expanded)
// ═══════════════════════════════════════════════════════════

describe('validateTracciatoRow', () => {
  it('should return errors for missing required fields', () => {
    const row = {};
    const issues = validateTracciatoRow(row);
    expect(issues.some(i => i.field === 'CodicePod')).toBe(true);
    expect(issues.some(i => i.field === 'CodiceFiscale')).toBe(true);
  });

  it('should validate enum and pattern', () => {
    const row = {
      CodicePod: 'IT001E0000000001',
      TipologiaGiuridica: 'XX',
      TipologiaSoggetto: 'ZZ',
      CodiceFiscale: 'INVALID',
      PartitaIVA: '123',
      CodiceAteco: '123',
    };
    const issues = validateTracciatoRow(row);
    expect(issues.some(i => i.code === 'ENUM')).toBe(true);
    expect(issues.some(i => i.code === 'PATTERN')).toBe(true);
  });

  it('should pass for a valid consumer row', () => {
    const row = {
      CodicePod: 'IT001E00112233',
      TipologiaGiuridica: 'PF',
      TipologiaSoggetto: 'PI',
      Nome: 'Mario',
      Cognome: 'Rossi',
      CodiceFiscale: 'RSSMRA85A01H501Z',
    };
    const issues = validateTracciatoRow(row);
    expect(issues.length).toBe(0);
  });

  it('should require Nome and Cognome for PF (persona fisica)', () => {
    const row = {
      CodicePod: 'IT001E00112233',
      TipologiaGiuridica: 'PF',
      TipologiaSoggetto: 'PI',
      CodiceFiscale: 'RSSMRA85A01H501Z',
      // Missing Nome and Cognome
    };
    const issues = validateTracciatoRow(row);
    expect(issues.some(i => i.field === 'Nome')).toBe(true);
    expect(issues.some(i => i.field === 'Cognome')).toBe(true);
  });

  it('should require RagioneSociale for PG (persona giuridica)', () => {
    const row = {
      CodicePod: 'IT001E00112233',
      TipologiaGiuridica: 'PG',
      TipologiaSoggetto: 'PI',
      CodiceFiscale: 'NRGVRD90B15F205X',
      PartitaIVA: '12345678901',
      // Missing RagioneSociale/NomeDitta
    };
    const issues = validateTracciatoRow(row);
    expect(issues.some(i => i.field === 'RagioneSociale/NomeDitta')).toBe(true);
  });

  it('should require GAUDÌ code for producers', () => {
    const row = {
      CodicePod: 'IT001E00112233',
      TipologiaGiuridica: 'PG',
      TipologiaSoggetto: 'PI',
      CodiceFiscale: 'NRGVRD90B15F205X',
      PartitaIVA: '12345678901',
      'RagioneSociale/NomeDitta': 'Energia Verde SRL',
      memberType: 'PRODUCER',
    };
    const issues = validateTracciatoRow(row);
    expect(issues.some(i => i.code === 'REQUIRED_PRODUCER' && i.field === 'CodiceGAUDI')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. CHECKLIST CONFIG TESTS
// ═══════════════════════════════════════════════════════════

describe('checklistConfig', () => {
  it('should return 5 document types for consumers', () => {
    const docs = getRequiredDocs('CONSUMER');
    expect(docs.length).toBe(5); // ID, BILL, VISURA, PAYMENT, PAYMENT_RECEIPT
    expect(docs.some(d => d.code === 'ID')).toBe(true);
    expect(docs.some(d => d.code === 'BILL')).toBe(true);
    expect(docs.some(d => d.code === 'VISURA')).toBe(true);
  });

  it('should return 16 document types for producers', () => {
    const docs = getRequiredDocs('PRODUCER');
    expect(docs.length).toBe(16); // all consumer docs + 11 producer-only
    expect(docs.some(d => d.code === 'DILA')).toBe(true);
    expect(docs.some(d => d.code === 'GAUDI_CERT')).toBe(true);
    expect(docs.some(d => d.code === 'NAMEPLATE_INVERTER')).toBe(true);
    expect(docs.some(d => d.code === 'NAMEPLATE_PV_MODULE')).toBe(true);
  });

  it('should build a checklist with received status', () => {
    const checklist = buildChecklist('CONSUMER', ['ID', 'BILL']);
    expect(checklist.length).toBe(5);
    const idItem = checklist.find(c => c.docType === 'ID');
    expect(idItem?.received).toBe(true);
    const visuraItem = checklist.find(c => c.docType === 'VISURA');
    expect(visuraItem?.received).toBe(false);
  });

  it('should detect incomplete checklist for consumer', () => {
    const result = checkChecklistComplete('CONSUMER', ['ID']); // missing BILL, VISURA
    expect(result.complete).toBe(false);
    expect(result.missingDocs.length).toBe(2); // BILL and VISURA are required
  });

  it('should detect complete checklist for consumer', () => {
    const result = checkChecklistComplete('CONSUMER', ['ID', 'BILL', 'VISURA']);
    expect(result.complete).toBe(true);
    expect(result.missingDocs.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 3. CROSS-VALIDATION TESTS
// ═══════════════════════════════════════════════════════════

describe('crossValidateMember', () => {
  it('should detect POD mismatch between bill and member record', () => {
    const issues = crossValidateMember({
      member: { podCode: 'IT001E00112233' },
      extractions: {
        BILL: { CodicePod: 'IT001E99999999' }, // different POD!
      },
    });
    expect(issues.some(i => i.code === 'CROSS_POD_MISMATCH_BILL')).toBe(true);
  });

  it('should detect fiscal code mismatch between ID and member', () => {
    const issues = crossValidateMember({
      member: { fiscalCode: 'RSSMRA85A01H501Z' },
      extractions: {
        ID: { CodiceFiscale: 'BNCLCU90B15F205X' }, // different CF!
      },
    });
    expect(issues.some(i => i.code === 'CROSS_CF_MISMATCH')).toBe(true);
  });

  it('should detect missing battery nameplate when storage enabled', () => {
    const issues = crossValidateMember({
      member: { hasStorage: true },
      extractions: {}, // no battery extraction
    });
    expect(issues.some(i => i.code === 'CROSS_MISSING_BATTERY_NAMEPLATE')).toBe(true);
  });

  it('should detect power mismatch between GAUDÌ and inverter', () => {
    const issues = crossValidateMember({
      member: {},
      extractions: {
        GAUDI_CERT: { plantPowerKW: 6.0 },
        NAMEPLATE_INVERTER: { ratedPowerKW: 15.0 }, // 150% diff, way over 20%
      },
    });
    expect(issues.some(i => i.code === 'CROSS_POWER_MISMATCH')).toBe(true);
  });

  it('should pass when all data is consistent', () => {
    const issues = crossValidateMember({
      member: { podCode: 'IT001E00112233', name: 'Mario', surname: 'Rossi', fiscalCode: 'RSSMRA85A01H501Z' },
      extractions: {
        BILL: { CodicePod: 'IT001E00112233' },
        ID: { Nome: 'Mario', Cognome: 'Rossi', CodiceFiscale: 'RSSMRA85A01H501Z' },
        CONNECTION_RECORD: { CodicePod: 'IT001E00112233' },
        GAUDI_CERT: { plantPowerKW: 6.0 },
        NAMEPLATE_INVERTER: { ratedPowerKW: 5.5 }, // within 20% tolerance
      },
    });
    expect(issues.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. EXTRACTION SCHEMA TESTS
// ═══════════════════════════════════════════════════════════

describe('extractionSchemas', () => {
  it('should have schemas for 8 extractable document types', () => {
    const extractable = getExtractableDocTypes();
    expect(extractable.length).toBe(8);
    expect(extractable).toContain('BILL');
    expect(extractable).toContain('ID');
    expect(extractable).toContain('NAMEPLATE_INVERTER');
  });

  it('should return undefined for non-extractable doc types', () => {
    const schema = getExtractionSchema('DILA' as any);
    expect(schema).toBeUndefined();
  });

  it('should validate correct BILL extraction data', () => {
    const schema = getExtractionSchema('BILL' as any);
    const result = schema!.safeParse({
      CodicePod: 'IT001E00112233',
      holderName: 'Mario Rossi',
    });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// 5. DOCUMENT EXTRACTOR TESTS
// ═══════════════════════════════════════════════════════════

describe('DocumentExtractor', () => {
  const extractor = new DocumentExtractor();

  it('should extract simulated data for BILL', async () => {
    const result = await extractor.extract('/fake/path/bolletta.pdf', 'BILL' as any);
    expect(result.extractable).toBe(true);
    expect(result.fields.CodicePod).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should extract simulated data for NAMEPLATE_INVERTER', async () => {
    const result = await extractor.extract('/fake/path/inverter.jpg', 'NAMEPLATE_INVERTER' as any);
    expect(result.extractable).toBe(true);
    expect(result.fields.manufacturer).toBeTruthy();
    expect(result.fields.ratedPowerKW).toBeGreaterThan(0);
  });

  it('should return non-extractable for DILA', async () => {
    const result = await extractor.extract('/fake/path/dila.pdf', 'DILA' as any);
    expect(result.extractable).toBe(false);
    expect(result.fields).toEqual({});
  });
});
