import React from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // In a production environment, this is where you'd put basic auth middleware checks 
    // or wrap with an AuthProvider if using NextAuth.
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">
                        Admin Dashboard
                    </h1>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
