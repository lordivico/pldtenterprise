import { z } from 'zod';

// Matches Prisma Enums
export const PlanType = z.enum(['FIBERBIZ_100', 'FIBERBIZ_300', 'AFFORDABOOST_500']);
export const OrgType = z.enum(['SOLE_PROP', 'PARTNERSHIP', 'CORP', 'COOP']);
export const DocType = z.enum([
    'MAYORS_PERMIT',
    'DTI',
    'SEC',
    'CDA',
    'BOARD_RES',
    'SEC_CERT',
    'BIO_PAGE_ID',
    'SPECIMEN_SIGS',
    'ARTICLES_OF_PARTNERSHIP',
    'PARTNERS_RESOLUTION',
]);

// File Validation Helper (Client-side mainly for type check, server handles strict file checks)
const isBrowser = typeof window !== 'undefined';

const fileSchema = z.custom<FileList | File | string>((v) => {
    if (v instanceof File) return true;
    if (isBrowser && v instanceof FileList) return v.length > 0;
    if (typeof v === 'string') return v.length > 0;
    return false;
}, {
    message: 'File is required',
});

// Allow empty string purely for type compatibility if needed, but the custom check handles string length
const fileOrString = fileSchema;

// Common Fields
const baseSchema = z.object({
    plan_type: PlanType,
    business_name: z.string().min(1, "Business Name is required"),
    trade_name: z.string().optional(),
    business_address: z.string().min(1, "Business Address is required"),
    billing_address: z.string().min(1, "Billing Address is required"),

    // Authorized Signatory
    signatory_name: z.string().min(1, "Signatory Name is required"),
    signatory_designation: z.string().min(1, "Designation is required"),
    signatory_contact: z.string().min(1, "Contact Number is required"),
    signatory_email: z.string().email("Invalid email address"),
    signatory_id_type: z.string().min(1, "ID Type is required"),
    signatory_id_number: z.string().min(1, "ID Number is required"),

    // Signature (Base64)
    digital_signature: z.string().min(1, "Digital signature is required"),

    // Common Docs
    bio_page_id: fileOrString,
    specimen_sigs: fileOrString, // 3 signatures file path/obj
});

// Conditional Logic per Org Type
export const applicationSchema = z.discriminatedUnion('org_type', [
    // SOLE PROPRIETORSHIP
    baseSchema.extend({
        org_type: z.literal(OrgType.enum.SOLE_PROP),
        mayors_permit: fileOrString,
        dti_registration: fileOrString,
    }),

    // PARTNERSHIP
    baseSchema.extend({
        org_type: z.literal(OrgType.enum.PARTNERSHIP),
        sec_registration: fileOrString,
        articles_of_partnership: fileOrString,
        partners_resolution: fileOrString,
    }),

    // CORPORATION
    baseSchema.extend({
        org_type: z.literal(OrgType.enum.CORP),
        sec_registration: fileOrString,
        sec_certificate: z.union([fileOrString, z.undefined()]).optional(), // Could be Board Res OR Sec Cert
        board_resolution: z.union([fileOrString, z.undefined()]).optional(),
    }).refine((data) => data.sec_certificate || data.board_resolution, {
        message: "Either Secretary's Certificate or Board Resolution is required",
        path: ["board_resolution"], // Attach error to one field
    }),

    // COOPERATIVE
    baseSchema.extend({
        org_type: z.literal(OrgType.enum.COOP),
        cda_registration: fileOrString,
        board_resolution: fileOrString,
    }),
]);

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
