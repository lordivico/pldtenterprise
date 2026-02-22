'use server';

import { z } from 'zod';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { applicationSchema, ApplicationFormValues, OrgType } from '@/schema/application';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

// Environment variable for upload directory, default to project-relative 'uploads'
const UPLOAD_DIR = process.env.UPLOAD_DIRECTORY_PATH || path.join(process.cwd(), 'uploads');


// Types for file tracking during rollback
// Types for file tracking during rollback
interface SavedFile {
    path: string;
}

// Map form field names to Prisma DocType enum
const DOC_TYPE_MAP: Record<string, string> = {
    mayors_permit: 'MAYORS_PERMIT',
    dti_registration: 'DTI',
    sec_registration: 'SEC',
    cda_registration: 'CDA',
    board_resolution: 'BOARD_RES',
    sec_certificate: 'SEC_CERT',
    bio_page_id: 'BIO_PAGE_ID',
    specimen_sigs: 'SPECIMEN_SIGS',
    articles_of_partnership: 'ARTICLES_OF_PARTNERSHIP',
    partners_resolution: 'PARTNERS_RESOLUTION'
};

export async function submitApplication(formData: FormData) {
    const savedFiles: SavedFile[] = [];
    const applicationId = randomUUID(); // Generate ID upfront for file naming

    try {
        // 1. Parse FormData
        const rawData: Record<string, any> = {};
        const fileFields: Record<string, File> = {};

        // Extract text fields and files
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                if (value.size > 0) { // Only consider non-empty files
                    fileFields[key] = value;
                }
            } else {
                // Handle text fields
                rawData[key] = value;
            }
        }

        // 2. Validate structured data using Zod (excluding files first)
        // We need to validatethe shape of the data minus the files, or create a flexible schema.
        // For simplicity, we'll validate the known text fields.
        // NOTE: The `applicationSchema` expects strings/enums/etc.
        // We might need to handle specific transforms if Zod expects something else.

        // Clean up rawData to match schema expectations (e.g. empty strings to undefined if needed)
        // For now, assuming client sends correct strings.

        // *Validate partial data first or validate full object if we map files out*
        // Ideally we validate the metadata *before* saving files to fail fast.

        // Let's rely on the client validation for the *structure* predominantly, 
        // but re-validate critical enum fields here.
        const planType = rawData.plan_type;
        const orgType = rawData.org_type;

        if (!planType || !orgType) {
            throw new Error("Missing required plan_type or org_type");
        }

        // 3. File Storage Execution
        await mkdir(path.join(UPLOAD_DIR, 'signatures'), { recursive: true });
        await mkdir(path.join(UPLOAD_DIR, 'documents'), { recursive: true });

        const timestamp = Date.now();

        // 3a. Save Digital Signature
        // Assuming 'digital_signature' in FormData is the base64 string
        const signatureBase64 = rawData.digital_signature as string;
        if (!signatureBase64) {
            throw new Error("Missing digital signature");
        }

        const signatureBuffer = Buffer.from(signatureBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const signatureFilename = `${applicationId}_SIGNATURE_${timestamp}.png`;
        const signaturePath = path.join(UPLOAD_DIR, 'signatures', signatureFilename);

        await writeFile(signaturePath, signatureBuffer);
        savedFiles.push({ path: signaturePath });

        // 3b. Save Documents
        const attachmentPaths: { docType: string, filePath: string, originalFilename: string }[] = [];

        // Map known file fields from the schema to their DocType enum equivalent (simplified mapping)
        // We need to know which file corresponds to which input name.
        // Based on ApplicationForm.tsx, input names match schema keys (e.g., 'mayors_permit').

        for (const [fieldName, file] of Object.entries(fileFields)) {
            // Map the field name to the Prisma DocType enum
            const docType = DOC_TYPE_MAP[fieldName];

            if (!docType) {
                console.warn(`[SubmitApplication] Unknown document field: ${fieldName}, skipping.`);
                continue;
            }
            const ext = path.extname(file.name) || '.bin';
            const filename = `${applicationId}_${docType}_${timestamp}${ext}`;
            const filePath = path.join(UPLOAD_DIR, 'documents', filename);

            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filePath, buffer);
            savedFiles.push({ path: filePath });

            attachmentPaths.push({ docType, filePath, originalFilename: file.name });
        }

        // 4. Database Transaction
        await prisma.$transaction(async (tx: any) => {
            // Create Application
            await tx.application.create({
                data: {
                    id: applicationId,
                    plan_type: planType,
                    org_type: orgType,
                    business_name: rawData.business_name || '',
                    business_address: rawData.business_address || '',
                    billing_address: rawData.billing_address || '',
                    business_ownership: rawData.business_ownership || 'Private',
                    tax_profile: rawData.tax_profile || 'VAT_REGISTERED',
                    company_tin: rawData.company_tin || '',
                    industry_type: rawData.industry_type || '',
                    date_of_registration: rawData.date_of_registration || '',
                    employees_count: rawData.employees_count || '',

                    // Create Signatory Relation
                    signatories: {
                        create: {
                            name: rawData.signatory_name || '',
                            designation: rawData.signatory_designation || '',
                            contact_number: rawData.signatory_contact || '',
                            email: rawData.signatory_email || '',
                            id_type: rawData.signatory_id_type || '',
                            id_number: rawData.signatory_id_number || '',
                            signature_path: signaturePath,
                        }
                    },

                    // Create Attachments Relation
                    attachments: {
                        create: attachmentPaths.map(att => ({
                            doc_type: att.docType, // Ensure this matches Prisma Enum or String
                            file_path: att.filePath,
                            original_filename: att.originalFilename
                        }))
                    }
                }
            });
        });

        return { success: true, applicationId };

    } catch (error) {
        console.error("Submission failed, rolling back files:", error);

        // 5. Orphaned File Prevention (Rollback)
        await Promise.allSettled(savedFiles.map(file => unlink(file.path)));

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown server error"
        };
    }
}
