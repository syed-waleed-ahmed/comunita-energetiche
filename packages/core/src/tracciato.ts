import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';

// Tracciato columns in required order (GSE Italian names)
export const TRACCIATO_COLUMNS = [
  'CodicePod',
  'Accumulostandalone',
  'TipologiaGiuridica',
  'FormaGiuridica',
  'TipologiaSoggetto',
  'SottotipologiaAmministrazioneLocaleISTAT',
  'SoggettoDotatoDiPartitaIVA',
  'StudioAssociato/SocietàDiProfessionisti',
  'Nome',
  'Cognome',
  'CodiceFiscale',
  'PartitaIVA',
  'CodiceAteco',
  'RagioneSociale/NomeDitta',
];

/**
 * Maps a Member record (English field names) to a Tracciato row (Italian GSE column names).
 * Also maps fields needed by the validation rule engine (CodiceGAUDI, PotenzaImpianto, etc.).
 */
export function memberToTracciatoRow(member: Record<string, any>): Record<string, any> {
  return {
    // ── Tracciato CSV columns ──
    'CodicePod': member.podCode || '',
    'Accumulostandalone': member.accumuloStandalone || '',
    'TipologiaGiuridica': member.legalType || '',
    'FormaGiuridica': member.formaGiuridica || '',
    'TipologiaSoggetto': member.subjectType || '',
    'SottotipologiaAmministrazioneLocaleISTAT': member.sottoTipologiaAmministrazioneLocale || '',
    'SoggettoDotatoDiPartitaIVA': member.vatNumber ? 'SI' : 'NO',
    'StudioAssociato/SocietàDiProfessionisti': member.studioAssociatoSocietaProfessionisti || '',
    'Nome': member.name || '',
    'Cognome': member.surname || '',
    'CodiceFiscale': member.fiscalCode || '',
    'PartitaIVA': member.vatNumber || '',
    'CodiceAteco': member.codiceAteco || '',
    'RagioneSociale/NomeDitta': member.ragioneSociale || '',

    // ── Extra fields for validation rule engine (not CSV columns) ──
    'CodiceGAUDI': member.censimpCode || '',
    'PotenzaImpianto': member.plantPowerKW,
    'DataAttivazione': member.dataAttivazione || '',
    'memberType': member.memberType || '',
    // Pass through censimpCode and plantPowerKW for the OR-check in validation
    'censimpCode': member.censimpCode || '',
    'plantPowerKW': member.plantPowerKW,
  };
}

export function generateTracciatoCSV(rows: any[], delimiter: string = ';'): string {
  const opts = { fields: TRACCIATO_COLUMNS, delimiter, header: true }; // header: true for column names
  return parse(rows, opts);
}
