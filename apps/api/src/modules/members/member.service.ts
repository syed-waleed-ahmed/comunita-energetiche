/**
 * Member Service — Business logic for member operations
 */
import { prisma } from '@ce/db';
import { z } from 'zod';

export const MemberCreateSchema = z.object({
  // Identity
  name: z.string().optional(),
  surname: z.string().optional(),
  fiscalCode: z.string().optional(),
  vatNumber: z.string().optional(),
  legalType: z.string().optional(),
  subjectType: z.string().optional(),
  memberType: z.string().optional(),

  // Birth
  placeOfBirth: z.string().optional(),
  provinceOfBirth: z.string().optional(),
  countryOfBirth: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),

  // Address
  address: z.string().optional(),
  houseNumber: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),

  // Contacts
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),

  // Professional & Financial
  profession: z.string().optional(),
  iban: z.string().optional(),
  podCode: z.string().optional(),
  referent: z.string().optional(),
  conventions: z.any().optional(),

  // Consents
  consentPrivacy: z.boolean().optional(),
  consentStatute: z.boolean().optional(),
  consentRegulation: z.boolean().optional(),

  // Producer-specific
  censimpCode: z.string().optional(),
  plantPowerKW: z.number().optional(),
  installedCapacityKW: z.number().optional(),
  hasStorage: z.boolean().optional(),
  dataAttivazione: z.string().optional(),

  // GSE / Company
  formaGiuridica: z.string().optional(),
  codiceAteco: z.string().optional(),
  ragioneSociale: z.string().optional(),
  accumuloStandalone: z.string().optional(),
  sottoTipologiaAmministrazioneLocale: z.string().optional(),
  studioAssociatoSocietaProfessionisti: z.string().optional(),
});

export type MemberCreateInput = z.infer<typeof MemberCreateSchema>;

const ALLOWED_UPDATE_FIELDS = [
  'name', 'surname', 'fiscalCode', 'vatNumber', 'legalType', 'subjectType',
  'podCode', 'status', 'memberType',
  'placeOfBirth', 'provinceOfBirth', 'countryOfBirth', 'dateOfBirth', 'gender',
  'address', 'houseNumber', 'city', 'province', 'postalCode',
  'phone', 'mobile', 'email', 'profession', 'iban', 'referent',
  'consentPrivacy', 'consentStatute', 'consentRegulation',
  'censimpCode', 'plantPowerKW', 'installedCapacityKW', 'hasStorage',
  'dataAttivazione', 'formaGiuridica', 'codiceAteco', 'ragioneSociale',
  'accumuloStandalone', 'sottoTipologiaAmministrazioneLocale',
  'studioAssociatoSocietaProfessionisti',
] as const;

export class MemberService {
  async create(data: MemberCreateInput) {
    const { dateOfBirth, ...rest } = data;
    let parsedDate: Date | undefined;
    if (dateOfBirth) {
      const parts = dateOfBirth.split('/');
      if (parts.length === 3) {
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    return prisma.member.create({ data: { ...rest, dateOfBirth: parsedDate, status: 'DRAFT' } });
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
