/**
 * Checklist Configuration for Comunità Energetiche Onboarding
 *
 * Returns the list of required/optional documents depending on
 * the member type (CONSUMER vs PRODUCER). A producer must submit
 * everything a consumer does, plus technical documentation for
 * the photovoltaic/storage installation.
 */

import { DOC_TYPE_CATALOG, DocTypeInfo, MemberType, DocType } from './docTypes';

// ────────────────────────────────────────────────────────────
// Checklist item (what the API returns per document)
// ────────────────────────────────────────────────────────────
export interface ChecklistItem {
    docType: DocType;
    displayName: string;
    description: string;
    required: boolean;
    received: boolean;
}

// ────────────────────────────────────────────────────────────
// Get required documents for a member type
// ────────────────────────────────────────────────────────────

/**
 * Returns the full checklist of document types that apply to the given
 * member type. Each item includes whether the document is required or
 * optional.
 *
 * Usage:
 *   const docs = getRequiredDocs('CONSUMER');
 *   // → [{ code: 'ID', required: true, ... }, { code: 'BILL', ... }, ...]
 *
 *   const docs = getRequiredDocs('PRODUCER');
 *   // → all consumer docs + DILA, RDE, GAUDI_CERT, ...
 */
export function getRequiredDocs(memberType: MemberType): DocTypeInfo[] {
    return DOC_TYPE_CATALOG.filter((doc) => doc.applicableTo.includes(memberType));
}

/**
 * Build the full checklist for a member, comparing required documents
 * against what has already been uploaded.
 *
 * @param memberType  CONSUMER or PRODUCER
 * @param uploadedDocTypes  Array of docType strings already uploaded for this member
 * @returns Array of ChecklistItem with received status
 */
export function buildChecklist(
    memberType: MemberType,
    uploadedDocTypes: string[]
): ChecklistItem[] {
    const requiredDocs = getRequiredDocs(memberType);
    return requiredDocs.map((doc) => ({
        docType: doc.code,
        displayName: doc.displayName,
        description: doc.description,
        required: doc.required,
        received: uploadedDocTypes.includes(doc.code),
    }));
}

/**
 * Checks if all required documents have been uploaded.
 *
 * @returns Object with `complete` boolean and list of `missingDocs`
 */
export function checkChecklistComplete(
    memberType: MemberType,
    uploadedDocTypes: string[]
): { complete: boolean; missingDocs: DocTypeInfo[] } {
    const requiredDocs = getRequiredDocs(memberType).filter((d) => d.required);
    const missingDocs = requiredDocs.filter((d) => !uploadedDocTypes.includes(d.code));
    return {
        complete: missingDocs.length === 0,
        missingDocs,
    };
}
