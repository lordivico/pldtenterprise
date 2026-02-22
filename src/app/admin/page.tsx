import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    // Fetch applications directly on the server
    let applications: any[] = [];
    try {
        applications = await prisma.application.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                signatories: true,
                attachments: true,
            },
        });
    } catch (e) {
        console.error("Database unavailable during build or runtime", e);
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Submitted Applications</h2>
                <div className="text-sm text-gray-500">Total: {applications.length}</div>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No applications have been submitted yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.map((app: any) => (
                                <tr key={app.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {app.business_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.plan_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.org_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(app.created_at).toLocaleDateString()} {new Date(app.created_at).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/api/admin/download/${app.id}`}
                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded inline-block"
                                        >
                                            Download Package
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
