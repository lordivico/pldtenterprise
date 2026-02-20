import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import archiver from 'archiver';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const applicationId = params.id;

    // TODO: Check admin authorization
    // TODO: Retrieve application data and file paths
    // TODO: Generate PDF using pdf-lib
    // TODO: Create ZIP stream using archiver

    return new NextResponse('ZIP stream here', {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="Application-${applicationId}.zip"`,
        },
    });
}
