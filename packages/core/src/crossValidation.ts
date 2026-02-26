/**
 * Cross-Validation for Comunità Energetiche
 *
 * Validates data consistency ACROSS multiple documents for the same member.
 * This catches mismatches that single-document validation cannot:
 *   - POD code must be the same on the bill and the connection record
 *   - Name/CF from the ID must match the member record
 *   - Company data from Visura must match the member record
 *   - Battery nameplate must be present if installation has storage
 *   - Plant power from GAUDÌ cert should be consistent with inverter specs
 */

import { DOC_TYPES } from './docTypes';
import { ValidationIssue } from './validation';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface CrossValidationInput {
    /** Member record from database */
    member: {
        name?: string | null;
        surname?: string | null;
        fiscalCode?: string | null;
        vatNumber?: string | null;
        podCode?: string | null;
        memberType?: string | null;
        hasStorage?: boolean | null;
        plantPowerKW?: number | null;
        [key: string]: any;
    };
    /** Extraction results keyed by document type */
    extractions: Record<string, Record<string, any>>;
}

// ────────────────────────────────────────────────────────────
// Cross-validation engine
// ────────────────────────────────────────────────────────────

export function crossValidateMember(input: CrossValidationInput): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { member, extractions } = input;

    // ── 1. POD Consistency ──
    // POD from utility bill must match the member record
    const billData = extractions[DOC_TYPES.BILL];
    if (billData?.CodicePod && member.podCode) {
        if (billData.CodicePod !== member.podCode) {
            issues.push({
                code: 'CROSS_POD_MISMATCH_BILL',
                message: `POD code on bill (${billData.CodicePod}) does not match member record (${member.podCode})`,
                field: 'CodicePod',
                severity: 'ERROR',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    // POD from connection record must match the member record
    const connData = extractions[DOC_TYPES.CONNECTION_RECORD];
    if (connData?.CodicePod && member.podCode) {
        if (connData.CodicePod !== member.podCode) {
            issues.push({
                code: 'CROSS_POD_MISMATCH_CONNECTION',
                message: `POD code on connection record (${connData.CodicePod}) does not match member record (${member.podCode})`,
                field: 'CodicePod',
                severity: 'ERROR',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    // POD from bill must match connection record (if both exist)
    if (billData?.CodicePod && connData?.CodicePod) {
        if (billData.CodicePod !== connData.CodicePod) {
            issues.push({
                code: 'CROSS_POD_MISMATCH_BILL_CONN',
                message: `POD code on bill (${billData.CodicePod}) does not match connection record (${connData.CodicePod})`,
                field: 'CodicePod',
                severity: 'ERROR',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    // ── 2. Identity Consistency ──
    // Name/Surname from ID must match member record
    const idData = extractions[DOC_TYPES.ID];
    if (idData?.Nome && member.name) {
        if (idData.Nome.toLowerCase() !== member.name.toLowerCase()) {
            issues.push({
                code: 'CROSS_NAME_MISMATCH',
                message: `Name on ID (${idData.Nome}) does not match member record (${member.name})`,
                field: 'Nome',
                severity: 'WARN',
                source: 'CROSS_VALIDATION',
            });
        }
    }
    if (idData?.Cognome && member.surname) {
        if (idData.Cognome.toLowerCase() !== member.surname.toLowerCase()) {
            issues.push({
                code: 'CROSS_SURNAME_MISMATCH',
                message: `Surname on ID (${idData.Cognome}) does not match member record (${member.surname})`,
                field: 'Cognome',
                severity: 'WARN',
                source: 'CROSS_VALIDATION',
            });
        }
    }
    if (idData?.CodiceFiscale && member.fiscalCode) {
        if (idData.CodiceFiscale.toUpperCase() !== member.fiscalCode.toUpperCase()) {
            issues.push({
                code: 'CROSS_CF_MISMATCH',
                message: `Fiscal code on ID (${idData.CodiceFiscale}) does not match member record (${member.fiscalCode})`,
                field: 'CodiceFiscale',
                severity: 'ERROR',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    // ── 3. Company Data Consistency ──
    // Visura company details must match member record
    const visuraData = extractions[DOC_TYPES.VISURA];
    if (visuraData?.PartitaIVA && member.vatNumber) {
        if (visuraData.PartitaIVA !== member.vatNumber) {
            issues.push({
                code: 'CROSS_VAT_MISMATCH',
                message: `VAT number on Visura (${visuraData.PartitaIVA}) does not match member record (${member.vatNumber})`,
                field: 'PartitaIVA',
                severity: 'ERROR',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    // ── 4. Storage / Battery Linkage ──
    // If member has storage, battery nameplate should be present
    if (member.hasStorage === true) {
        const batteryData = extractions[DOC_TYPES.NAMEPLATE_BATTERY];
        if (!batteryData || Object.keys(batteryData).length === 0) {
            issues.push({
                code: 'CROSS_MISSING_BATTERY_NAMEPLATE',
                message: 'Member has storage enabled but no battery nameplate extraction found',
                field: 'hasStorage',
                severity: 'WARN',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    // ── 5. Plant Power Consistency ──
    // GAUDÌ cert power should be consistent with inverter rated power
    const gaudiData = extractions[DOC_TYPES.GAUDI_CERT];
    const inverterData = extractions[DOC_TYPES.NAMEPLATE_INVERTER];
    if (gaudiData?.plantPowerKW && inverterData?.ratedPowerKW) {
        const diff = Math.abs(gaudiData.plantPowerKW - inverterData.ratedPowerKW);
        // Allow 20% tolerance (GAUDÌ may declare nominal vs nameplate peak)
        if (diff > gaudiData.plantPowerKW * 0.2) {
            issues.push({
                code: 'CROSS_POWER_MISMATCH',
                message: `Plant power on GAUDÌ cert (${gaudiData.plantPowerKW} kW) differs significantly from inverter rated power (${inverterData.ratedPowerKW} kW)`,
                field: 'plantPowerKW',
                severity: 'WARN',
                source: 'CROSS_VALIDATION',
            });
        }
    }

    return issues;
}
