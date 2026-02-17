import { z } from 'zod';

// Hardcoded rules for MVP, can be loaded from JSON
const rules = require('../../../prisma/rules.json');

export interface ValidationIssue {
  code: string;
  message: string;
  field?: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  source: 'RULE_ENGINE';
}

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
    // Required if
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
    // Enum
    if (fieldRule.enum && value && !fieldRule.enum.includes(value)) {
      issues.push({
        code: 'ENUM',
        message: `${fieldRule.name} must be one of ${fieldRule.enum.join(', ')}`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }
    // Pattern
    if (fieldRule.pattern && value && !(new RegExp(fieldRule.pattern).test(value))) {
      issues.push({
        code: 'PATTERN',
        message: `${fieldRule.name} does not match required format`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }
    // Min/Max length
    if (fieldRule.minLength && value && value.length < fieldRule.minLength) {
      issues.push({
        code: 'MIN_LENGTH',
        message: `${fieldRule.name} must be at least ${fieldRule.minLength} chars`,
        field: fieldRule.name,
        severity: 'ERROR',
        source: 'RULE_ENGINE',
      });
    }
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
  // PF/PG logic
  if (row['TipologiaGiuridica'] === 'PF') {
    if (!row['Nome']) issues.push({ code: 'REQUIRED', message: 'Nome required for PF', field: 'Nome', severity: 'ERROR', source: 'RULE_ENGINE' });
    if (!row['Cognome']) issues.push({ code: 'REQUIRED', message: 'Cognome required for PF', field: 'Cognome', severity: 'ERROR', source: 'RULE_ENGINE' });
  }
  if (row['TipologiaGiuridica'] === 'PG') {
    if (!row['RagioneSociale/NomeDitta']) issues.push({ code: 'REQUIRED', message: 'RagioneSociale/NomeDitta required for PG', field: 'RagioneSociale/NomeDitta', severity: 'ERROR', source: 'RULE_ENGINE' });
  }
  if (!row['CodiceFiscale']) issues.push({ code: 'REQUIRED', message: 'CodiceFiscale required', field: 'CodiceFiscale', severity: 'ERROR', source: 'RULE_ENGINE' });
  return issues;
}
