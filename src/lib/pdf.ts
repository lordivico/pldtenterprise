import { PDFDocument, rgb } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';

export const PDF_TEMPLATES: Record<string, string> = {
    'FIBERBIZ_100': 'SME-FiberBiz-2024-01_100Mbps-3.pdf',
    'FIBERBIZ_300': 'SME-FiberBiz-2024-01_300Mbps-2.pdf',
    'AFFORDABOOST_500': 'Affordaboost-500-Mbps-App-Form-2.pdf'
};

// Map coordinates for text drawing. 
// Origin (0,0) in pdf-lib is bottom-left.
// These coordinates act as placeholders requiring precise calibration.
const FIELD_COORDINATES: Record<string, Record<string, { x: number, y: number, page: number }>> = {
    'FIBERBIZ_100': {
        business_name: { x: 100, y: 650, page: 0 },
        business_address: { x: 100, y: 630, page: 0 },
        billing_address: { x: 100, y: 610, page: 0 },
        signatory_name: { x: 100, y: 300, page: 0 },
        signatory_designation: { x: 100, y: 280, page: 0 },
        signatory_contact: { x: 100, y: 260, page: 0 },
        signatory_email: { x: 100, y: 240, page: 0 },
        signature: { x: 100, y: 320, page: 0 }
    },
    'FIBERBIZ_300': {
        business_name: { x: 100, y: 650, page: 0 },
        business_address: { x: 100, y: 630, page: 0 },
        billing_address: { x: 100, y: 610, page: 0 },
        signatory_name: { x: 100, y: 300, page: 0 },
        signatory_designation: { x: 100, y: 280, page: 0 },
        signatory_contact: { x: 100, y: 260, page: 0 },
        signatory_email: { x: 100, y: 240, page: 0 },
        signature: { x: 100, y: 320, page: 0 }
    },
    'AFFORDABOOST_500': {
        business_name: { x: 100, y: 650, page: 0 },
        business_address: { x: 100, y: 630, page: 0 },
        billing_address: { x: 100, y: 610, page: 0 },
        signatory_name: { x: 100, y: 300, page: 0 },
        signatory_designation: { x: 100, y: 280, page: 0 },
        signatory_contact: { x: 100, y: 260, page: 0 },
        signatory_email: { x: 100, y: 240, page: 0 },
        signature: { x: 100, y: 320, page: 0 }
    }
};

const BCIF_COORDINATES: Record<string, { x: number, y: number, page: number }> = {
    business_name: { x: 200, y: 650, page: 0 },
    business_address: { x: 200, y: 600, page: 0 },
    billing_address: { x: 200, y: 550, page: 0 },
    business_ownership: { x: 200, y: 500, page: 0 },
    tax_profile: { x: 200, y: 475, page: 0 },
    company_tin: { x: 200, y: 450, page: 0 },
    industry_type: { x: 200, y: 425, page: 0 },
    date_of_registration: { x: 200, y: 400, page: 0 },
    employees_count: { x: 400, y: 400, page: 0 },
    org_type: { x: 200, y: 375, page: 0 }, // Sole prop / Partner / Corp

    // Signatory / Finance / Bill Recipient
    signatory_name: { x: 100, y: 300, page: 0 },
    signatory_designation: { x: 250, y: 300, page: 0 },
    signatory_contact: { x: 350, y: 300, page: 0 },
    signatory_email: { x: 450, y: 300, page: 0 },
    signatory_id_type: { x: 100, y: 250, page: 0 },
    signatory_id_number: { x: 250, y: 250, page: 0 },
    signature: { x: 100, y: 100, page: 0 }
};

export async function generateApplicationPDF(applicationData: any, signatoryData: any): Promise<Uint8Array> {
    const templateName = PDF_TEMPLATES[applicationData.plan_type as string];
    if (!templateName) {
        throw new Error(`No PDF template configured for plan: ${applicationData.plan_type}`);
    }

    const templatePath = path.join(process.cwd(), templateName);
    const pdfBytes = await readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const coords = FIELD_COORDINATES[applicationData.plan_type as string] || FIELD_COORDINATES['FIBERBIZ_100'];

    // --- DRAW GRID FOR CALIBRATION ---
    for (const page of pages) {
        const { width, height } = page.getSize();

        // Vertical lines (X coordinates) - Red
        for (let x = 0; x < width; x += 25) {
            page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, opacity: 0.3, color: rgb(1, 0, 0) });
            page.drawText(`${x}`, { x: x + 2, y: 10, size: 8, color: rgb(1, 0, 0) });
            page.drawText(`${x}`, { x: x + 2, y: height - 10, size: 8, color: rgb(1, 0, 0) });
        }

        // Horizontal lines (Y coordinates) - Blue
        for (let y = 0; y < height; y += 25) {
            page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, opacity: 0.3, color: rgb(0, 0, 1) });
            page.drawText(`${y}`, { x: 10, y: y + 2, size: 8, color: rgb(0, 0, 1) });
            page.drawText(`${y}`, { x: width - 20, y: y + 2, size: 8, color: rgb(0, 0, 1) });
        }
    }
    // ---------------------------------

    // Draw text fields manually since there are no interactive form fields
    const textFields = [
        { key: 'business_name', text: applicationData.business_name },
        { key: 'business_address', text: applicationData.business_address },
        { key: 'billing_address', text: applicationData.billing_address },
        { key: 'signatory_name', text: signatoryData.name },
        { key: 'signatory_designation', text: signatoryData.designation },
        { key: 'signatory_contact', text: signatoryData.contact_number },
        { key: 'signatory_email', text: signatoryData.email },
    ];

    for (const field of textFields) {
        const coord = coords[field.key];
        if (coord && field.text) {
            const page = pages[coord.page];
            if (page) {
                page.drawText(field.text, {
                    x: coord.x,
                    y: coord.y,
                    size: 10,
                    color: rgb(0, 0, 0),
                });
            }
        }
    }

    // Embed Signature visually
    if (signatoryData.signature_path) {
        try {
            const sigBytes = await readFile(signatoryData.signature_path);
            const signatureImage = await pdfDoc.embedPng(sigBytes);
            const sigCoord = coords.signature;
            const page = pages[sigCoord.page];

            if (page && sigCoord) {
                const sigDims = signatureImage.scaleToFit(150, 50);
                page.drawImage(signatureImage, {
                    x: sigCoord.x,
                    y: sigCoord.y,
                    width: sigDims.width,
                    height: sigDims.height,
                });
            }
        } catch (error) {
            console.error("Failed to embed signature image:", error);
        }
    }

    const form = pdfDoc.getForm();
    if (form) {
        form.flatten();
    }

    const finalPdfBytes = await pdfDoc.save();
    return finalPdfBytes;
}

export async function generateBCIFPDF(applicationData: any, signatoryData: any): Promise<Uint8Array> {
    const templateName = 'BCIF-WITH-CORP-SUBS-DEC_PLDT-SMART-ePLDT-ver11.3-withTPA_22Jan2026.pdf';

    const templatePath = path.join(process.cwd(), templateName);
    const pdfBytes = await readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const coords = BCIF_COORDINATES;

    // --- DRAW GRID FOR CALIBRATION (Will help user adjust coordinates) ---
    for (const page of pages) {
        const { width, height } = page.getSize();
        for (let x = 0; x < width; x += 25) {
            page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, opacity: 0.3, color: rgb(1, 0, 0) });
            page.drawText(`${x}`, { x: x + 2, y: 10, size: 8, color: rgb(1, 0, 0) });
            page.drawText(`${x}`, { x: x + 2, y: height - 10, size: 8, color: rgb(1, 0, 0) });
        }
        for (let y = 0; y < height; y += 25) {
            page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, opacity: 0.3, color: rgb(0, 0, 1) });
            page.drawText(`${y}`, { x: 10, y: y + 2, size: 8, color: rgb(0, 0, 1) });
            page.drawText(`${y}`, { x: width - 20, y: y + 2, size: 8, color: rgb(0, 0, 1) });
        }
    }
    // ---------------------------------

    const textFields = [
        { key: 'business_name', text: applicationData.business_name },
        { key: 'business_address', text: applicationData.business_address },
        { key: 'billing_address', text: applicationData.billing_address },
        { key: 'business_ownership', text: applicationData.business_ownership },
        { key: 'tax_profile', text: applicationData.tax_profile },
        { key: 'company_tin', text: applicationData.company_tin },
        { key: 'industry_type', text: applicationData.industry_type },
        { key: 'date_of_registration', text: applicationData.date_of_registration },
        { key: 'employees_count', text: applicationData.employees_count },
        { key: 'org_type', text: applicationData.org_type },
        { key: 'signatory_name', text: signatoryData.name },
        { key: 'signatory_designation', text: signatoryData.designation },
        { key: 'signatory_contact', text: signatoryData.contact_number },
        { key: 'signatory_email', text: signatoryData.email },
        { key: 'signatory_id_type', text: signatoryData.id_type },
        { key: 'signatory_id_number', text: signatoryData.id_number },
    ];

    for (const field of textFields) {
        const coord = coords[field.key];
        if (coord && field.text) {
            const page = pages[coord.page];
            if (page) {
                page.drawText(field.text, {
                    x: coord.x,
                    y: coord.y,
                    size: 8,
                    color: rgb(0, 0, 0),
                });
            }
        }
    }

    if (signatoryData.signature_path) {
        try {
            const sigBytes = await readFile(signatoryData.signature_path);
            const signatureImage = await pdfDoc.embedPng(sigBytes);
            const sigCoord = coords.signature;
            const page = pages[sigCoord.page];

            if (page && sigCoord) {
                const sigDims = signatureImage.scaleToFit(100, 40);
                page.drawImage(signatureImage, {
                    x: sigCoord.x,
                    y: sigCoord.y,
                    width: sigDims.width,
                    height: sigDims.height,
                });
            }
        } catch (error) {
            console.error("Failed to embed signature in BCIF:", error);
        }
    }

    const form = pdfDoc.getForm();
    if (form) {
        form.flatten();
    }

    const finalPdfBytes = await pdfDoc.save();
    return finalPdfBytes;
}
