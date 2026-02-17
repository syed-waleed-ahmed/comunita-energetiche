// FakeLLMExtractor for MVP: returns empty fields and needs_review flag
export interface ExtractionResult {
  fields: Record<string, any>;
  confidence: number;
  evidence?: any;
  needsReview: boolean;
}

export class FakeLLMExtractor {
  async extract(documentPath: string, schemaName: string): Promise<ExtractionResult> {
    // For MVP, return empty fields and needsReview
    if (schemaName === 'BILL') {
      return {
        fields: { CodicePod: '', holder: '' },
        confidence: 0,
        needsReview: true,
      };
    }
    if (schemaName === 'ID') {
      return {
        fields: { Nome: '', Cognome: '', CodiceFiscale: '', expiry: '' },
        confidence: 0,
        needsReview: true,
      };
    }
    return {
      fields: {},
      confidence: 0,
      needsReview: true,
    };
  }
}
