import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const formName = searchParams.get('formName');
        const mappingFilePath = path.join(process.cwd(), 'pdf_mappings.json');

        let mappings: Record<string, any> = {};
        try {
            const currentData = await readFile(mappingFilePath, 'utf-8');
            mappings = JSON.parse(currentData);
        } catch (e) {
            // File might not exist yet, return empty
            return NextResponse.json(formName ? [] : {});
        }

        if (formName) {
            return NextResponse.json(mappings[formName] || []);
        }

        return NextResponse.json(mappings);
    } catch (e) {
        console.error('Error reading mapping:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { formName, fields } = body;

        if (!formName || !fields || !Array.isArray(fields)) {
            return new NextResponse('Invalid payload', { status: 400 });
        }

        const mappingFilePath = path.join(process.cwd(), 'pdf_mappings.json');

        let existingMappings: Record<string, any> = {};

        try {
            const currentData = await readFile(mappingFilePath, 'utf-8');
            existingMappings = JSON.parse(currentData);
        } catch (e) {
            // File might not exist yet, which is fine
        }

        // Overwrite or add the mapping for specifically this form
        existingMappings[formName] = fields;

        await writeFile(mappingFilePath, JSON.stringify(existingMappings, null, 2));

        return NextResponse.json({ success: true, message: 'Mappings saved' });
    } catch (e) {
        console.error('Error saving mapping:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
