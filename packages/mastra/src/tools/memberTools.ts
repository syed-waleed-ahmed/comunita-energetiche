/**
 * Member Tools — Search, Register, Update
 */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// ────────────────────────────────────────────────────────────
// Tool: Search Members
// ────────────────────────────────────────────────────────────
export const memberSearchTool = createTool({
    id: 'member-search',
    description: 'Search for a member by name, fiscal code, POD code, email, or VAT number.',
    inputSchema: z.object({
        query: z.string().describe('Search query — name, fiscal code (CF), POD, email, or VAT number'),
    }),
    outputSchema: z.object({ members: z.array(z.any()), count: z.number() }),
    execute: async (inputData: any) => {
        const { query } = inputData;
        const where = query
            ? {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } as any },
                    { surname: { contains: query, mode: 'insensitive' } as any },
                    { fiscalCode: { contains: query, mode: 'insensitive' } as any },
                    { vatNumber: { contains: query, mode: 'insensitive' } as any },
                    { podCode: { contains: query, mode: 'insensitive' } as any },
                    { email: { contains: query, mode: 'insensitive' } as any },
                    { mobile: { contains: query, mode: 'insensitive' } as any },
                ],
            }
            : undefined;
        const members = await prisma.member.findMany({ where, take: 50 });
        return { members, count: members.length };
    },
});

// ────────────────────────────────────────────────────────────
// Tool: Register New Member (matches 100% of registration form)
// ────────────────────────────────────────────────────────────
export const registerMemberTool = createTool({
    id: 'register-member',
    description:
        'Register a brand new member. Accepts all personal data fields from the registration form: name, surname, fiscal code, birth info, address, contacts, IBAN, member type, consents, etc. Use this when a user wants to enrol a new consumer or producer.',
    inputSchema: z.object({
        // Identity
        name: z.string().describe('First name (Nome)'),
        surname: z.string().describe('Last name (Cognome)'),
        fiscalCode: z.string().describe('Codice Fiscale'),
        memberType: z.enum(['CONSUMER', 'PRODUCER', 'PROSUMER']).describe('Member type'),
        legalType: z.enum(['PF', 'PG']).optional().describe('PF = persona fisica, PG = persona giuridica'),
        vatNumber: z.string().optional().describe('Partita IVA (only for PG)'),
        // Birth
        placeOfBirth: z.string().optional(),
        provinceOfBirth: z.string().optional(),
        countryOfBirth: z.string().optional().default('Italia'),
        dateOfBirth: z.string().optional().describe('Date of birth as dd/mm/yyyy'),
        gender: z.enum(['M', 'F']).optional(),
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
        consentPrivacy: z.boolean().optional().default(false),
        consentStatute: z.boolean().optional().default(false),
        consentRegulation: z.boolean().optional().default(false),
    }),
    outputSchema: z.any(),
    execute: async (inputData: any) => {
        // Parse dateOfBirth string → Date if present
        let dateOfBirth: Date | undefined;
        if (inputData.dateOfBirth) {
            const parts = inputData.dateOfBirth.split('/');
            if (parts.length === 3) {
                dateOfBirth = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        }

        const member = await prisma.member.create({
            data: {
                status: 'DRAFT',
                memberType: inputData.memberType,
                name: inputData.name,
                surname: inputData.surname,
                fiscalCode: inputData.fiscalCode,
                legalType: inputData.legalType || 'PF',
                vatNumber: inputData.vatNumber,
                placeOfBirth: inputData.placeOfBirth,
                provinceOfBirth: inputData.provinceOfBirth,
                countryOfBirth: inputData.countryOfBirth || 'Italia',
                dateOfBirth,
                gender: inputData.gender,
                address: inputData.address,
                houseNumber: inputData.houseNumber,
                city: inputData.city,
                province: inputData.province,
                postalCode: inputData.postalCode,
                phone: inputData.phone,
                mobile: inputData.mobile,
                email: inputData.email,
                profession: inputData.profession,
                iban: inputData.iban,
                podCode: inputData.podCode,
                referent: inputData.referent,
                conventions: inputData.conventions || {},
                consentPrivacy: inputData.consentPrivacy || false,
                consentStatute: inputData.consentStatute || false,
                consentRegulation: inputData.consentRegulation || false,
            },
        });

        return { member, message: `Member ${member.name} ${member.surname} registered with ID ${member.id}` };
    },
});

// ────────────────────────────────────────────────────────────
// Tool: Update Member Field
// ────────────────────────────────────────────────────────────
const ALLOWED_FIELDS = [
    'name', 'surname', 'fiscalCode', 'vatNumber', 'legalType', 'subjectType',
    'memberType', 'podCode', 'status',
    'placeOfBirth', 'provinceOfBirth', 'countryOfBirth', 'dateOfBirth', 'gender',
    'address', 'houseNumber', 'city', 'province', 'postalCode',
    'phone', 'mobile', 'email', 'profession', 'iban', 'referent',
    'consentPrivacy', 'consentStatute', 'consentRegulation',
    'censimpCode', 'plantPowerKW', 'installedCapacityKW', 'hasStorage',
];

export const updateMemberFieldTool = createTool({
    id: 'update-member-field',
    description: `Update a single field on a member record. Allowed fields: ${ALLOWED_FIELDS.join(', ')}.`,
    inputSchema: z.object({
        memberId: z.string(),
        field: z.string(),
        value: z.string(),
    }),
    outputSchema: z.any(),
    execute: async (inputData: any) => {
        const { memberId, field, value } = inputData;
        if (!ALLOWED_FIELDS.includes(field)) {
            throw new Error(`Field "${field}" is not allowed. Allowed: ${ALLOWED_FIELDS.join(', ')}`);
        }
        const member = await prisma.member.update({ where: { id: memberId }, data: { [field]: value } });
        return { member };
    },
});
