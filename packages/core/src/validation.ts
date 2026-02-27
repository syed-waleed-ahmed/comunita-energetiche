import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Robust directory traversal to find rules.json since Vite shifts cwd/dirname
let rulesPath = '';
let currentDir = process.cwd();
while (currentDir !== path.parse(currentDir).root) {
  const checkPath = path.join(currentDir, 'prisma', 'rules.json');
  if (fs.existsSync(checkPath)) {
    rulesPath = checkPath;
    break;
  }
  currentDir = path.dirname(currentDir);
}
if (!rulesPath) throw new Error('Could not strictly locate prisma/rules.json from ' + process.cwd());

const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

export interface ValidationIssue {
  code: string;
  message: string;
  field?: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  source: string; // 'RULE_ENGINE' | 'CROSS_VALIDATION'
}

/**
 * Validate a single tracciato row against field-level rules.
 * This handles format, enum, pattern, length, and conditional requirements.
 */
export function validateTracciatoRow(row: Record<string, any>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const fieldRule of rules.fields) {
    const value = row[fieldRule.name];

    // Required
    if (fieldRule.required && (value === undefined || value === null || value === '')) {
      issues.push({
        code: 'REQUIRED',
        message: `${fieldRule.name} is required`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
      continue;
    }

    // Required if (conditional requirement)
    if (fieldRule.required_if) {
      const cond = fieldRule.required_if;
      if (row[cond.field] === cond.value && (value === undefined || value === null || value === '')) {
        issues.push({
          code: 'REQUIRED_IF',
          message: `${fieldRule.name} is required if ${cond.field} == ${cond.value}`,
          field: fieldRule.name,
          severity: 'ERROR',
          source: 'RULE_ENGINE',
        });
        continue;
      }
    }

    // Enum validation
    if (fieldRule.enum && value && !fieldRule.enum.includes(value)) {
      issues.push({
        code: 'ENUM',
        message: `${fieldRule.name} must be one of ${fieldRule.enum.join(', ')}`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }

    // Pattern (regex) validation
    if (fieldRule.pattern && value && !(new RegExp(fieldRule.pattern).test(value))) {
      issues.push({
        code: 'PATTERN',
        message: `${fieldRule.name} does not match required format`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }

    // Min length
    if (fieldRule.minLength && value && value.length < fieldRule.minLength) {
      issues.push({
        code: 'MIN_LENGTH',
        message: `${fieldRule.name} must be at least ${fieldRule.minLength} chars`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }

    // Max length
    if (fieldRule.maxLength && value && value.length > fieldRule.maxLength) {
      issues.push({
        code: 'MAX_LENGTH',
        message: `${fieldRule.name} must be at most ${fieldRule.maxLength} chars`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }
  }

  // ── PF/PG logic (persona fisica vs giuridica) ──
  if (row['TipologiaGiuridica'] === 'PF') {
    if (!row['Nome']) issues.push({ code: 'REQUIRED', message: 'Nome required for PF', field: 'Nome', severity: 'ERROR', source: 'RULE_ENGINE' });
    if (!row['Cognome']) issues.push({ code: 'REQUIRED', message: 'Cognome required for PF', field: 'Cognome', severity: 'ERROR', source: 'RULE_ENGINE' });
  }
  if (row['TipologiaGiuridica'] === 'PG') {
    if (!row['RagioneSociale/NomeDitta']) issues.push({ code: 'REQUIRED', message: 'RagioneSociale/NomeDitta required for PG', field: 'RagioneSociale/NomeDitta', severity: 'ERROR', source: 'RULE_ENGINE' });
  }
  if (!row['CodiceFiscale']) issues.push({ code: 'REQUIRED', message: 'CodiceFiscale required', field: 'CodiceFiscale', severity: 'ERROR', source: 'RULE_ENGINE' });

  // ── Producer-specific rules ──
  if (row['memberType'] === 'PRODUCER') {
    // GAUDÌ code required for producers
    if (!row['CodiceGAUDI'] && !row['censimpCode']) {
      issues.push({
        code: 'REQUIRED_PRODUCER',
        message: 'CodiceGAUDI (CENSIMP code) is required for producers',
        field: 'CodiceGAUDI',
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }
    // Plant power should be provided
    if (row['PotenzaImpianto'] === undefined && row['plantPowerKW'] === undefined) {
      issues.push({
        code: 'REQUIRED_PRODUCER',
        message: 'PotenzaImpianto (plant power kW) is required for producers',
        field: 'PotenzaImpianto',
        severity: 'WARN',
        source: 'RULE_ENGINE',
      });
    }
  }

  return issues;
}
