/**
 * Mastra Tools for Comunità Energetiche Onboarding Agent
 *
 * These are proper Mastra tools using `createTool` from @mastra/core.
 * The LLM decides which tool to call based on the user's message.
 * Each tool wraps an API call to the Fastify backend.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.default_x_api_key || 'dev123';
const headers = { 'x-api-key': API_KEY };

// ────────────────────────────────────────────────────────────
// Tool: Search Members
// ────────────────────────────────────────────────────────────

export const memberSearchTool = createTool({
  id: 'member-search',
  description: 'Search for a member by name, fiscal code, POD code, or VAT number. Use this when the user asks about a specific member or mentions a name/code.',
  inputSchema: z.object({
    query: z.string().describe('The search query — can be a name, fiscal code (CF), POD code, or VAT number'),
  }),
  outputSchema: z.object({
    members: z.array(z.any()),
    count: z.number(),
  }),
  execute: async (inputData: any) => {
    const res = await axios.get(`${API_URL}/members`, {
      params: { query: inputData.query },
      headers,
    });
    return { members: res.data, count: res.data.length };
  },
});

// ────────────────────────────────────────────────────────────
// Tool: Check Document Checklist
// ────────────────────────────────────────────────────────────

export const checklistTool = createTool({
  id: 'checklist-check',
  description: 'Check the document checklist for a member. Returns which documents are required, which have been received, and which are still missing. Use this after finding a member to see their document status.',
  inputSchema: z.object({
    memberId: z.string().describe('The member UUID to check the checklist for'),
  }),
  outputSchema: z.object({
    memberType: z.string(),
    checklist: z.array(z.any()),
    complete: z.boolean(),
    missingRequired: z.array(z.any()),
  }),
  execute: async (inputData: any) => {
    const res = await axios.get(`${API_URL}/members/${inputData.memberId}/checklist`, { headers });
    return res.data;
  },
});

// ────────────────────────────────────────────────────────────
// Tool: Validate Member
// ────────────────────────────────────────────────────────────

export const validateMemberTool = createTool({
  id: 'validate-member',
  description: 'Run validation on a member. Checks both field-level rules (format, required, enum) and cross-document consistency (POD matching, identity verification, power consistency). Use this to check if a member\'s data is valid.',
  inputSchema: z.object({
    memberId: z.string().describe('The member UUID to validate'),
  }),
  outputSchema: z.object({
    rowValidation: z.any(),
    crossValidation: z.any(),
    totalIssues: z.number(),
  }),
  execute: async (inputData: any) => {
    const res = await axios.post(`${API_URL}/members/${inputData.memberId}/validate`, {}, { headers });
    return res.data;
  },
});

// ────────────────────────────────────────────────────────────
// Tool: Run Document Extraction
// ────────────────────────────────────────────────────────────

export const extractDocumentTool = createTool({
  id: 'extract-document',
  description: 'Extract structured data from an uploaded document. The system will auto-detect the document type and extract relevant fields (POD code from bills, serial numbers from nameplates, etc.).',
  inputSchema: z.object({
    documentId: z.string().describe('The document UUID to extract data from'),
  }),
  outputSchema: z.object({
    extraction: z.any(),
    needsReview: z.boolean(),
    extractable: z.boolean(),
  }),
  execute: async (inputData: any) => {
    const res = await axios.post(`${API_URL}/extractions/run`, {
      documentId: inputData.documentId,
    }, { headers });
    return res.data;
  },
});

// ────────────────────────────────────────────────────────────
// Tool: List Member Documents
// ────────────────────────────────────────────────────────────

export const listDocumentsTool = createTool({
  id: 'list-documents',
  description: 'List all documents uploaded for a specific member. Returns document IDs, types, and extraction status.',
  inputSchema: z.object({
    memberId: z.string().describe('The member UUID to list documents for'),
  }),
  outputSchema: z.object({
    documents: z.array(z.any()),
    count: z.number(),
  }),
  execute: async (inputData: any) => {
    const res = await axios.get(`${API_URL}/members/${inputData.memberId}/documents`, { headers });
    return { documents: res.data, count: res.data.length };
  },
});

// ────────────────────────────────────────────────────────────
// Tool: Update Member Field
// ────────────────────────────────────────────────────────────

export const updateMemberFieldTool = createTool({
  id: 'update-member-field',
  description: 'Update a single field on a member record. Can update: name, surname, fiscalCode, vatNumber, legalType, subjectType, podCode, status, memberType, censimpCode, plantPowerKW, installedCapacityKW, hasStorage.',
  inputSchema: z.object({
    memberId: z.string().describe('The member UUID to update'),
    field: z.string().describe('The field name to update'),
    value: z.string().describe('The new value for the field'),
  }),
  outputSchema: z.object({
    member: z.any(),
  }),
  execute: async (inputData: any) => {
    const res = await axios.patch(`${API_URL}/members/${inputData.memberId}/field`, {
      field: inputData.field,
      value: inputData.value,
    }, { headers });
    return { member: res.data };
  },
});

// ────────────────────────────────────────────────────────────
// Tool: Generate Tracciato
// ────────────────────────────────────────────────────────────

export const generateTracciatoTool = createTool({
  id: 'generate-tracciato',
  description: 'Generate a Tracciato CSV batch for GSE portal submission. Can optionally specify member IDs, or defaults to all members with READY_FOR_TRACCIATO status.',
  inputSchema: z.object({
    memberIds: z.array(z.string()).optional().describe('Optional list of member UUIDs to include in the batch'),
  }),
  outputSchema: z.object({
    batchId: z.string(),
  }),
  execute: async (inputData: any) => {
    const res = await axios.post(`${API_URL}/tracciato/batches`, {
      memberIds: inputData.memberIds,
    }, { headers });
    return res.data;
  },
});
