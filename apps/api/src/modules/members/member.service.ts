/**
 * Member Service — Business logic for member operations
 */
import { prisma } from '@ce/db';
import { z } from 'zod';

export const MemberCreateSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  fiscalCode: z.string().optional(),
  vatNumber: z.string().optional(),
  legalType: z.string().optional(),
  subjectType: z.string().optional(),
  podCode: z.string().optional(),
  memberType: z.string().optional(),
  censimpCode: z.string().optional(),
  plantPowerKW: z.number().optional(),
  installedCapacityKW: z.number().optional(),
  hasStorage: z.boolean().optional(),
});

export type MemberCreateInput = z.infer<typeof MemberCreateSchema>;

const ALLOWED_UPDATE_FIELDS = [
  'name', 'surname', 'fiscalCode', 'vatNumber', 'legalType', 'subjectType',
  'podCode', 'status', 'memberType', 'censimpCode', 'plantPowerKW',
  'installedCapacityKW', 'hasStorage',
] as const;

export class MemberService {
  async create(data: MemberCreateInput) {
    return prisma.member.create({ data: { ...data, status: 'DRAFT' } });
  }

  async search(query?: string) {
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { surname: { contains: query, mode: 'insensitive' as const } },
            { fiscalCode: { contains: query, mode: 'insensitive' as const } },
            { vatNumber: { contains: query, mode: 'insensitive' as const } },
            { podCode: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    return prisma.member.findMany({ where, take: 50 });
  }

  async getById(id: string) {
    return prisma.member.findUnique({
      where: { id },
      include: { documents: true, validationIssues: true },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.member.update({ where: { id }, data: { status } });
  }

  async updateField(id: string, field: string, value: any) {
    if (!ALLOWED_UPDATE_FIELDS.includes(field as any)) {
      throw Object.assign(new Error(`Field "${field}" is not allowed`), { statusCode: 400 });
    }
    return prisma.member.update({ where: { id }, data: { [field]: value } });
  }
}

export const memberService = new MemberService();
