'use client';

import React, { useTransition } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, ApplicationFormValues, OrgType } from '@/schema/application';
// import SignatureCanvas from './SignatureCanvas';
import dynamic from 'next/dynamic';
import { submitApplication } from '@/app/actions/submit-application';

const SignatureCanvas = dynamic(() => import('./SignatureCanvas'), {
    ssr: false,
    loading: () => <p>Loading Signature Pad...</p>,
});

export default function ApplicationForm() {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
        setValue,
    } = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            plan_type: 'FIBERBIZ_100',
            org_type: 'SOLE_PROP',
        },
    });

    const selectedOrgType = watch('org_type');

    const onSubmit: SubmitHandler<ApplicationFormValues> = (data) => {
        const formData = new FormData();

        // 1. Append valid text fields
        // We iterate over the data object and append keys that are not files/FileLists first
        (Object.keys(data) as Array<keyof ApplicationFormValues>).forEach((key) => {
            const value = data[key];
            if (key === 'mayors_permit' || key === 'dti_registration' || key === 'sec_registration' ||
                key === 'articles_of_partnership' || key === 'partners_resolution' || key === 'sec_certificate' ||
                key === 'board_resolution' || key === 'cda_registration' || key === 'bio_page_id' ||
                key === 'specimen_sigs') {
                // Skip file fields here, handle separately to ensure correct extraction
                return;
            }
            if (value !== undefined && value !== null) {
                formData.append(key, value as string);
            }
        });

        // 2. Append Signature
        if (data.digital_signature) {
            formData.append('digital_signature', data.digital_signature);
        }

        // 3. Append Files
        // Helper to append file from FileList or File
        const appendFile = (key: string, fileOrList: any) => {
            if (fileOrList instanceof FileList && fileOrList.length > 0) {
                formData.append(key, fileOrList[0]);
            } else if (fileOrList instanceof File) {
                formData.append(key, fileOrList);
            }
        };

        // Common Docs
        appendFile('bio_page_id', data.bio_page_id);
        appendFile('specimen_sigs', data.specimen_sigs);

        // Conditional Docs
        if (selectedOrgType === 'SOLE_PROP') {
            appendFile('mayors_permit', data.mayors_permit);
            appendFile('dti_registration', data.dti_registration);
        } else if (selectedOrgType === 'PARTNERSHIP') {
            appendFile('sec_registration', data.sec_registration);
            appendFile('articles_of_partnership', data.articles_of_partnership);
            appendFile('partners_resolution', data.partners_resolution);
        } else if (selectedOrgType === 'CORP') {
            appendFile('sec_registration', data.sec_registration);
            appendFile('sec_certificate', data.sec_certificate);
            appendFile('board_resolution', data.board_resolution);
        } else if (selectedOrgType === 'COOP') {
            appendFile('cda_registration', data.cda_registration);
            appendFile('board_resolution', data.board_resolution);
        }

        startTransition(async () => {
            try {
                const result = await submitApplication(formData);
                if (result.success) {
                    alert(`Application Submitted Successfully! ID: ${result.applicationId}`);
                    // Optionally reset form or redirect
                } else {
                    alert(`Submission Failed: ${result.error}`);
                }
            } catch (e) {
                console.error(e);
                alert("An unexpected error occurred.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6 max-w-4xl mx-auto">

            {/* SECTION 1: Plan Selection */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold">1. Select Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['FIBERBIZ_100', 'FIBERBIZ_300', 'AFFORDABOOST_500'].map((plan) => (
                        <label key={plan} className="border p-4 rounded cursor-pointer hover:bg-gray-50 block">
                            <input
                                type="radio"
                                value={plan}
                                {...register('plan_type')}
                                className="mr-2"
                            />
                            {plan}
                        </label>
                    ))}
                </div>
                {errors.plan_type && <p className="text-red-500">{errors.plan_type.message}</p>}
            </section>

            {/* SECTION 2: Org Type */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold">2. Organization Type</h2>
                <select {...register('org_type')} className="w-full p-2 border rounded">
                    <option value="SOLE_PROP">Sole Proprietorship</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="CORP">Corporation</option>
                    <option value="COOP">Cooperative</option>
                </select>
                {errors.org_type && <p className="text-red-500">{errors.org_type.message}</p>}
            </section>

            {/* SECTION 3: Business Info (Common) */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold">3. Business Information</h2>
                <div className="grid grid-cols-1 gap-4">
                    <input {...register('business_name')} placeholder="Registered Business Name" className="p-2 border rounded" />
                    {errors.business_name && <p className="text-red-500">{errors.business_name.message}</p>}

                    <input {...register('business_address')} placeholder="Business Address" className="p-2 border rounded" />
                    {errors.business_address && <p className="text-red-500">{errors.business_address.message}</p>}

                    <input {...register('billing_address')} placeholder="Billing Address" className="p-2 border rounded" />
                    {errors.billing_address && <p className="text-red-500">{errors.billing_address.message}</p>}
                </div>
            </section>

            {/* SECTION 4: Conditional Document Uploads */}
            <section className="space-y-4 border-t pt-4">
                <h2 className="text-xl font-bold">4. Required Documents</h2>

                {/* COMMON DOCS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-4 bg-gray-50">
                        <label className="block font-medium">Valid ID (Signatory)</label>
                        <input type="file" {...register('bio_page_id')} className="w-full mt-2" accept=".pdf,.png,.jpg,.jpeg" />
                        {errors.bio_page_id && <p className="text-red-500">{errors.bio_page_id.message as string}</p>}
                    </div>

                    <div className="border p-4 bg-gray-50">
                        <label className="block font-medium">3 Specimen Signatures</label>
                        <input type="file" {...register('specimen_sigs')} className="w-full mt-2" accept=".pdf,.png,.jpg,.jpeg" />
                        {errors.specimen_sigs && <p className="text-red-500">{errors.specimen_sigs.message as string}</p>}
                    </div>
                </div>

                {/* CONDITIONAL DOCS */}
                <div className="space-y-4 mt-4">

                    {selectedOrgType === 'SOLE_PROP' && (
                        <>
                            <div className="border p-4 bg-blue-50">
                                <label className="block font-medium">Mayor's Permit</label>
                                <input type="file" {...register('mayors_permit')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.mayors_permit && <p className="text-red-500">{errors.mayors_permit.message}</p>}
                            </div>
                            <div className="border p-4 bg-blue-50">
                                <label className="block font-medium">DTI Registration</label>
                                <input type="file" {...register('dti_registration')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.dti_registration && <p className="text-red-500">{errors.dti_registration.message}</p>}
                            </div>
                        </>
                    )}

                    {selectedOrgType === 'PARTNERSHIP' && (
                        <>
                            <div className="border p-4 bg-green-50">
                                <label className="block font-medium">SEC Registration</label>
                                <input type="file" {...register('sec_registration')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.sec_registration && <p className="text-red-500">{errors.sec_registration.message}</p>}
                            </div>
                            <div className="border p-4 bg-green-50">
                                <label className="block font-medium">Articles of Partnership</label>
                                <input type="file" {...register('articles_of_partnership')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.articles_of_partnership && <p className="text-red-500">{errors.articles_of_partnership.message}</p>}
                            </div>
                            <div className="border p-4 bg-green-50">
                                <label className="block font-medium">Partners Resolution</label>
                                <input type="file" {...register('partners_resolution')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.partners_resolution && <p className="text-red-500">{errors.partners_resolution.message}</p>}
                            </div>
                        </>
                    )}

                    {selectedOrgType === 'CORP' && (
                        <>
                            <div className="border p-4 bg-purple-50">
                                <label className="block font-medium">SEC Registration</label>
                                <input type="file" {...register('sec_registration')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.sec_registration && <p className="text-red-500">{errors.sec_registration.message}</p>}
                            </div>
                            <div className="border p-4 bg-purple-50">
                                <label className="block font-medium">Secretary's Cert / Board Resolution</label>
                                <p className="text-xs text-gray-500">Upload at least one.</p>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input type="file" {...register('sec_certificate')} className="border p-1 w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                    <input type="file" {...register('board_resolution')} className="border p-1 w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                </div>
                                {/* @ts-ignore */}
                                {errors.board_resolution && <p className="text-red-500">{errors.board_resolution.message}</p>}
                            </div>
                        </>
                    )}

                    {selectedOrgType === 'COOP' && (
                        <>
                            <div className="border p-4 bg-orange-50">
                                <label className="block font-medium">CDA Registration</label>
                                <input type="file" {...register('cda_registration')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.cda_registration && <p className="text-red-500">{errors.cda_registration.message}</p>}
                            </div>
                            <div className="border p-4 bg-orange-50">
                                <label className="block font-medium">Board Resolution</label>
                                <input type="file" {...register('board_resolution')} className="w-full" accept=".pdf,.png,.jpg,.jpeg" />
                                {/* @ts-ignore */}
                                {errors.board_resolution && <p className="text-red-500">{errors.board_resolution.message}</p>}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* SECTION 5: Signatory Info */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold">5. Authorized Signatory</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input {...register('signatory_name')} placeholder="Full Name" className="p-2 border rounded" />
                    <input {...register('signatory_designation')} placeholder="Designation" className="p-2 border rounded" />
                    <input {...register('signatory_contact')} placeholder="Contact Number" className="p-2 border rounded" />
                    <input {...register('signatory_email')} placeholder="Email" className="p-2 border rounded" />
                    <input {...register('signatory_id_type')} placeholder="ID Type" className="p-2 border rounded" />
                    <input {...register('signatory_id_number')} placeholder="ID Number" className="p-2 border rounded" />
                </div>
            </section>

            {/* SECTION 6: Digital Signature Canvas */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold">6. Digital Signature</h2>
                <Controller
                    control={control}
                    name="digital_signature"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <SignatureCanvas
                            value={value}
                            onChange={onChange}
                            error={error?.message}
                        />
                    )}
                />
            </section>

            <div className="pt-6">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isPending ? 'Submitting...' : 'Submit Application'}
                </button>
            </div>

            {/* <pre className="mt-5 p-4 bg-gray-200 text-xs">{JSON.stringify(watch(), null, 2)}</pre> */}
        </form>
    );
}
