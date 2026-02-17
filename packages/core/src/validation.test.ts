import { validateTracciatoRow } from '../src/validation';

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
});
