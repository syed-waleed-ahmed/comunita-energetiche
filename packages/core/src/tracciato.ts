import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';

// Tracciato columns in required order
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

export function generateTracciatoCSV(rows: any[], delimiter: string = ';'): string {
  const opts = { fields: TRACCIATO_COLUMNS, delimiter, header: true }; // header: true for column names
  return parse(rows, opts);
}
