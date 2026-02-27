/**
 * Shared DocumentExtractor Singleton
 * Single extractor instance reused across all document tools.
 */
import { DocumentExtractor } from '../../../core/src/extractor';

export const extractor = new DocumentExtractor();
