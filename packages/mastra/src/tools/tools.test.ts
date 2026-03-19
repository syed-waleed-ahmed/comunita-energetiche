/**
 * Integration Tests — Agent Tools
 *
 * Tests the execute() logic of each tool with mocked Prisma.
 * These verify the business logic layer without hitting a real database.
 */

// Mock Prisma before imports
jest.mock('../lib/prisma', () => ({
  prisma: {
    member: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    extractionResult: {
      create: jest.fn(),
    },
    validationIssue: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    tracciatoBatch: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tracciatoRow: {
      create: jest.fn(),
    },
    fileArtifact: {
      create: jest.fn(),
    },
  },
}));

// Mock extractor
jest.mock('../lib/extractor', () => ({
  extractor: {
    extract: jest.fn().mockResolvedValue({
      docType: 'BILL',
      fields: { CodicePod: 'IT001E00112233', holderName: 'Mario Rossi' },
      confidence: 0.92,
      evidence: { source: 'simulated_extraction' },
      needsReview: false,
      extractable: true,
    }),
  },
}));

// Mock fs — validation.ts uses fs.existsSync/readFileSync at load time
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

import { prisma } from '../lib/prisma';
import { memberSearchTool, registerMemberTool, updateMemberFieldTool } from './memberTools';
import { extractDocumentTool, listDocumentsTool } from './documentTools';
import { checklistTool, validateMemberTool } from './validationTools';
import { generateTracciatoTool } from './tracciatoTools';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ═══════════════════════════════════════════════════════════
// 1. MEMBER TOOLS
// ═══════════════════════════════════════════════════════════

describe('memberSearchTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should search members by query', async () => {
    const mockMembers = [
      { id: '1', name: 'Mario', surname: 'Rossi', fiscalCode: 'RSSMRA85A01H501Z' },
    ];
    (mockPrisma.member.findMany as jest.Mock).mockResolvedValue(mockMembers);

    const result = await (memberSearchTool as any).execute({ query: 'Mario' });

    expect(mockPrisma.member.findMany).toHaveBeenCalledTimes(1);
    expect(result.members).toHaveLength(1);
    expect(result.count).toBe(1);
  });

  it('should return all members when query is empty', async () => {
    (mockPrisma.member.findMany as jest.Mock).mockResolvedValue([]);

    const result = await (memberSearchTool as any).execute({ query: '' });

    expect(result.count).toBe(0);
  });
});

describe('registerMemberTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create a new consumer member', async () => {
    const mockMember = { id: 'uuid-1', name: 'Luigi', surname: 'Verdi', status: 'DRAFT' };
    (mockPrisma.member.create as jest.Mock).mockResolvedValue(mockMember);

    const result = await (registerMemberTool as any).execute({
      name: 'Luigi',
      surname: 'Verdi',
      fiscalCode: 'VRDLGU90B15F205X',
      memberType: 'CONSUMER',
    });

    expect(mockPrisma.member.create).toHaveBeenCalledTimes(1);
    expect(result.member.name).toBe('Luigi');
    expect(result.message).toContain('Luigi');
  });

  it('should parse dateOfBirth in dd/mm/yyyy format', async () => {
    (mockPrisma.member.create as jest.Mock).mockResolvedValue({ id: '1', name: 'Test', surname: 'User' });

    await (registerMemberTool as any).execute({
      name: 'Test',
      surname: 'User',
      fiscalCode: 'TSTMRA85A01H501Z',
      memberType: 'CONSUMER',
      dateOfBirth: '15/03/1990',
    });

    const createCall = (mockPrisma.member.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.dateOfBirth).toBeInstanceOf(Date);
  });
});

describe('updateMemberFieldTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update an allowed field', async () => {
    (mockPrisma.member.update as jest.Mock).mockResolvedValue({ id: '1', email: 'new@test.com' });

    const result = await (updateMemberFieldTool as any).execute({
      memberId: '1',
      field: 'email',
      value: 'new@test.com',
    });

    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { email: 'new@test.com' },
    });
    expect(result.member.email).toBe('new@test.com');
  });

  it('should reject disallowed fields', async () => {
    await expect(
      (updateMemberFieldTool as any).execute({
        memberId: '1',
        field: 'password',
        value: 'hacked',
      })
    ).rejects.toThrow('not allowed');
  });
});

// ═══════════════════════════════════════════════════════════
// 2. DOCUMENT TOOLS
// ═══════════════════════════════════════════════════════════

describe('extractDocumentTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should extract data from an existing document', async () => {
    (mockPrisma.document.findUnique as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      storagePath: '/uploads/bolletta.pdf',
      docType: 'BILL',
    });
    (mockPrisma.extractionResult.create as jest.Mock).mockResolvedValue({
      id: 'ext-1',
      json: { CodicePod: 'IT001E00112233' },
    });
    (mockPrisma.document.update as jest.Mock).mockResolvedValue({});

    const result = await (extractDocumentTool as any).execute({ documentId: 'doc-1' });

    expect(result.extractable).toBe(true);
    expect(mockPrisma.extractionResult.create).toHaveBeenCalledTimes(1);
  });

  it('should throw if document not found', async () => {
    (mockPrisma.document.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      (extractDocumentTool as any).execute({ documentId: 'nonexistent' })
    ).rejects.toThrow('Document not found');
  });
});

describe('listDocumentsTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should list documents for a member', async () => {
    const mockDocs = [
      { id: 'd1', docType: 'BILL', memberId: 'm1' },
      { id: 'd2', docType: 'ID', memberId: 'm1' },
    ];
    (mockPrisma.document.findMany as jest.Mock).mockResolvedValue(mockDocs);

    const result = await (listDocumentsTool as any).execute({ memberId: 'm1' });

    expect(result.documents).toHaveLength(2);
    expect(result.count).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════
// 3. VALIDATION TOOLS
// ═══════════════════════════════════════════════════════════

describe('checklistTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return checklist status for a consumer', async () => {
    (mockPrisma.member.findUnique as jest.Mock).mockResolvedValue({
      id: 'm1',
      memberType: 'CONSUMER',
      documents: [{ docType: 'ID' }, { docType: 'BILL' }],
    });

    const result = await (checklistTool as any).execute({ memberId: 'm1' });

    expect(result.memberType).toBe('CONSUMER');
    expect(result.checklist.length).toBeGreaterThan(0);
    expect(typeof result.complete).toBe('boolean');
  });

  it('should throw if member not found', async () => {
    (mockPrisma.member.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      (checklistTool as any).execute({ memberId: 'missing' })
    ).rejects.toThrow('Member not found');
  });
});

describe('validateMemberTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should run validation and persist issues', async () => {
    (mockPrisma.member.findUnique as jest.Mock).mockResolvedValue({
      id: 'm1',
      memberType: 'CONSUMER',
      name: 'Mario',
      surname: 'Rossi',
      fiscalCode: 'RSSMRA85A01H501Z',
      podCode: 'IT001E00112233',
      legalType: 'PF',
      documents: [],
    });
    (mockPrisma.validationIssue.deleteMany as jest.Mock).mockResolvedValue({});
    (mockPrisma.validationIssue.createMany as jest.Mock).mockResolvedValue({});
    (mockPrisma.member.update as jest.Mock).mockResolvedValue({});

    const result = await (validateMemberTool as any).execute({ memberId: 'm1' });

    expect(typeof result.totalIssues).toBe('number');
    expect(mockPrisma.validationIssue.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.member.update).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. TRACCIATO TOOLS
// ═══════════════════════════════════════════════════════════

describe('generateTracciatoTool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should throw if no eligible members', async () => {
    (mockPrisma.member.findMany as jest.Mock).mockResolvedValue([]);

    await expect(
      (generateTracciatoTool as any).execute({})
    ).rejects.toThrow('No eligible members');
  });

  it('should generate a batch and CSV for eligible members', async () => {
    const mockMembers = [{
      id: 'm1', name: 'Mario', surname: 'Rossi', fiscalCode: 'RSSMRA85A01H501Z',
      podCode: 'IT001E00112233', legalType: 'PF', memberType: 'CONSUMER',
    }];
    (mockPrisma.member.findMany as jest.Mock).mockResolvedValue(mockMembers);
    (mockPrisma.tracciatoBatch.create as jest.Mock).mockResolvedValue({ id: 'b1', status: 'PENDING' });
    (mockPrisma.tracciatoRow.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.tracciatoBatch.findUnique as jest.Mock).mockResolvedValue({
      id: 'b1',
      rows: [{ dataJson: { CodicePod: 'IT001E00112233', Nome: 'Mario' } }],
    });
    (mockPrisma.fileArtifact.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.tracciatoBatch.update as jest.Mock).mockResolvedValue({});

    const result = await (generateTracciatoTool as any).execute({});

    expect(result.batchId).toBe('b1');
    expect(mockPrisma.tracciatoBatch.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.tracciatoRow.create).toHaveBeenCalledTimes(1);
  });
});
