/**
 * Shared DocumentExtractor Singleton
 * Single extractor instance reused across all document tools.
 */
import { DocumentExtractor } from '@ce/packages-core';

export const extractor = new DocumentExtractor();
