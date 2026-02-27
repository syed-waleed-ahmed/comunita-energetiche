import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function main() {
    const filePath = path.join(__dirname, 'docs necessari iscrizione/consumatore/bolletta.pdf');
    const buffer = fs.readFileSync(filePath);

    console.log('Extracting PDF using Gemini 1.5 Flash...');
    const result = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: z.object({
            CodicePod: z.string(),
            holderName: z.string(),
            address: z.string(),
            supplyType: z.string(),
        }),
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Estrai i seguenti dati da questa bolletta italiana. Rispondi con JSON strutturato e accurato. Tieni conto anche di testo scritto in piccolo e dettagli tecnici.' },
                    { type: 'file', mimeType: 'application/pdf', data: buffer }
                ]
            }
        ]
    });

    console.log('Extracted Data:');
    console.log(JSON.stringify(result.object, null, 2));
}

main().catch(console.error);
