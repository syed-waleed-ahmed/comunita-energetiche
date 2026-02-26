/**
 * Document Type Definitions for Comunità Energetiche Onboarding
 *
 * Each document type maps directly to real enrollment documents found in
 * the "docs necessari iscrizione" folder (consumatore/ and produttore/).
 *
 * Member types:
 *   CONSUMER  — energy consumer joining the community
 *   PRODUCER  — energy producer (has PV/storage installation)
 */

// ────────────────────────────────────────────────────────────
// Member type
// ────────────────────────────────────────────────────────────
export type MemberType = 'CONSUMER' | 'PRODUCER';

// ────────────────────────────────────────────────────────────
// Document type identifiers
// ────────────────────────────────────────────────────────────
export const DOC_TYPES = {
    // ── Shared (consumer + producer) ──
    ID: 'ID',
    BILL: 'BILL',
    VISURA: 'VISURA',
    PAYMENT: 'PAYMENT',

    // ── Producer-only ──
    DILA: 'DILA',
    RDE: 'RDE',
    GAUDI_CERT: 'GAUDI_CERT',
    CONCESSION: 'CONCESSION',
    ELECTRICAL_LICENSE: 'ELECTRICAL_LICENSE',
    CONNECTION_RECORD: 'CONNECTION_RECORD',
    SINGLE_LINE_DIAGRAM: 'SINGLE_LINE_DIAGRAM',
    PV_SERIAL_LIST: 'PV_SERIAL_LIST',
    NAMEPLATE_INVERTER: 'NAMEPLATE_INVERTER',
    NAMEPLATE_PV_MODULE: 'NAMEPLATE_PV_MODULE',
    NAMEPLATE_BATTERY: 'NAMEPLATE_BATTERY',
} as const;

export type DocType = (typeof DOC_TYPES)[keyof typeof DOC_TYPES];

// ────────────────────────────────────────────────────────────
// Metadata per document type
// ────────────────────────────────────────────────────────────
export interface DocTypeInfo {
    code: DocType;
    displayName: string;
    description: string;
    /** Which member types require this document */
    applicableTo: MemberType[];
    /** Whether the document is mandatory (vs. optional/conditional) */
    required: boolean;
    /** Accepted MIME types for upload */
    acceptedMimeTypes: string[];
}

export const DOC_TYPE_CATALOG: DocTypeInfo[] = [
    // ── Shared documents ──
    {
        code: DOC_TYPES.ID,
        displayName: 'Carta d\'Identità',
        description: 'Identity card of the legal representative',
        applicableTo: ['CONSUMER', 'PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
        code: DOC_TYPES.BILL,
        displayName: 'Bolletta Elettrica',
        description: 'Electricity utility bill — proves the POD (Point of Delivery) code',
        applicableTo: ['CONSUMER', 'PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.VISURA,
        displayName: 'Visura Camerale',
        description: 'Chamber of Commerce registry extract — proves corporate identity',
        applicableTo: ['CONSUMER', 'PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.PAYMENT,
        displayName: 'Ricevuta di Pagamento',
        description: 'Payment receipt for membership fee',
        applicableTo: ['CONSUMER', 'PRODUCER'],
        required: false,
        acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },

    // ── Producer-only documents ──
    {
        code: DOC_TYPES.DILA,
        displayName: 'DILA',
        description: 'Dichiarazione Inizio Lavori Asseverata — building/installation permit for PV system',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.RDE,
        displayName: 'RDE',
        description: 'Richiesta Di Esercizio — operating request submitted to the grid operator',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.GAUDI_CERT,
        displayName: 'Certificato GAUDÌ',
        description: 'Certificate from Terna\'s GAUDÌ registry — identifies the generation unit (CENSIMP code)',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.CONCESSION,
        displayName: 'Delibera di Concessione',
        description: 'Municipal deliberation granting concession for energy production',
        applicableTo: ['PRODUCER'],
        required: false,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.ELECTRICAL_LICENSE,
        displayName: 'Licenza Officina Elettrica',
        description: 'Electrical workshop/exercise license from customs agency',
        applicableTo: ['PRODUCER'],
        required: false,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.CONNECTION_RECORD,
        displayName: 'Verbale di Allaccio',
        description: 'Grid connection record from ENEL/e-distribuzione — confirms POD and connection details',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.SINGLE_LINE_DIAGRAM,
        displayName: 'Schema Unifilare',
        description: 'Single-line electrical diagram of the installation (with or without storage)',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/pdf'],
    },
    {
        code: DOC_TYPES.PV_SERIAL_LIST,
        displayName: 'Elenco Numeri di Serie FTV',
        description: 'Excel list of serial numbers for all installed PV modules',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    },
    {
        code: DOC_TYPES.NAMEPLATE_INVERTER,
        displayName: 'Targhetta Inverter',
        description: 'Photo of the inverter nameplate — captures model, serial number, rated power',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['image/jpeg', 'image/png'],
    },
    {
        code: DOC_TYPES.NAMEPLATE_PV_MODULE,
        displayName: 'Targhetta Modulo FV',
        description: 'Photo of the PV module nameplate — captures model, serial number, max power (Wp)',
        applicableTo: ['PRODUCER'],
        required: true,
        acceptedMimeTypes: ['image/jpeg', 'image/png'],
    },
    {
        code: DOC_TYPES.NAMEPLATE_BATTERY,
        displayName: 'Targhetta Accumulo',
        description: 'Photo of the battery storage nameplate — captures model, serial number, energy capacity (kWh)',
        applicableTo: ['PRODUCER'],
        required: false, // only required if installation has storage
        acceptedMimeTypes: ['image/jpeg', 'image/png'],
    },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
export function getDocTypeInfo(code: DocType): DocTypeInfo | undefined {
    return DOC_TYPE_CATALOG.find((d) => d.code === code);
}

export function getAllDocTypeCodes(): DocType[] {
    return DOC_TYPE_CATALOG.map((d) => d.code);
}
