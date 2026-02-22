import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import archiver from 'archiver';
import { generateApplicationPDF, generateBCIFPDF } from '@/lib/pdf';
import { createReadStream, existsSync } from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    context: any
) {
    const params = await context.params;
    const applicationId = params.id;

    // TODO: Add strict robust Admin Authentication here 

    try {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { signatories: true, attachments: true }
        });

        if (!application) {
            return new NextResponse('Application not found', { status: 404 });
        }

        const signatory = application.signatories[0];
        if (!signatory) {
            return new NextResponse('Signatory data not found', { status: 400 });
        }

        // Generate filled PDF
        const pdfBytes = await generateApplicationPDF(application, signatory);
        const bcifPdfBytes = await generateBCIFPDF(application, signatory);

        // Readable stream setup using Web Streams API
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        archive.on('data', (data) => {
            writer.write(data);
        });

        archive.on('error', (err) => {
            writer.abort(err);
        });

        archive.on('end', () => {
            writer.close();
        });

        // 1. Append the Application Form PDF itself
        archive.append(Buffer.from(pdfBytes), { name: `Application_Form_${application.business_name || application.id}.pdf` });

        // Append the BCIF PDF
        archive.append(Buffer.from(bcifPdfBytes), { name: `BCIF_${application.business_name || application.id}.pdf` });

        // 2. Append all uploaded documents
        for (const attachment of application.attachments) {
            if (existsSync(attachment.file_path)) {
                archive.file(attachment.file_path, { name: `Attachments/${path.basename(attachment.file_path)}` });
            } else {
                console.warn(`Attachment file missing on disk: ${attachment.file_path}`);
            }
        }

        // Finalize the archive, telling archiver we've appended everything
        archive.finalize();

        // Convert the TransformStream's readable side to a valid Response body
        return new Response(stream.readable as unknown as ReadableStream, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="Application-${applicationId}.zip"`,
            }
        });
    } catch (e) {
        console.error("Error generating package", e);
        return new NextResponse('Internal Server Error generating package', { status: 500 });
    }
}
