'use client';

import { useState, useRef, MouseEvent, useEffect } from 'react';

// List of available PDF templates
const PDF_TEMPLATES = [
    'BCIF-WITH-CORP-SUBS-DEC_PLDT-SMART-ePLDT-ver11.3-withTPA_22Jan2026.pdf',
    'SME-FiberBiz-2024-01_100Mbps-3.pdf',
    'SME-FiberBiz-2024-01_300Mbps-2.pdf',
    'Affordaboost-500-Mbps-App-Form-2.pdf'
];

interface FieldMarker {
    id: string; // Unique ID for multiple instances of same field
    fieldKey: string;
    x: number;
    y: number;
    page: number; // Placeholder: using iframe means paging is tricky to capture, will default to 0
}

export default function GraphMapperPage() {
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

    // Field inventory
    const [availableFields, setAvailableFields] = useState<string[]>([
        'business_name', 'business_address', 'billing_address', 'business_ownership',
        'tax_profile', 'company_tin', 'industry_type', 'date_of_registration',
        'employees_count', 'org_type', 'signatory_name', 'signatory_designation',
        'signatory_contact', 'signatory_email', 'signatory_id_type', 'signatory_id_number',
        'signature',
        'chk_ownership_sole', 'chk_ownership_partner', 'chk_ownership_corp',
        'chk_tax_vat', 'chk_tax_nonvat', 'chk_industry_retail', 'chk_industry_service'
    ]);
    const [newFieldInput, setNewFieldInput] = useState('');

    // Placed markers
    const [markers, setMarkers] = useState<FieldMarker[]>([]);

    // Drag state
    const [draggedField, setDraggedField] = useState<string | null>(null);
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

    // Reference for PDF overlay container
    const overlayRef = useRef<HTMLDivElement>(null);

    // Load markers on PDF change
    useEffect(() => {
        setMarkers([]);
        setActiveMarkerId(null);

        if (selectedPdf) {
            fetch(`/api/admin/mapping?formName=${encodeURIComponent(selectedPdf)}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const loadedMarkers: FieldMarker[] = data.map((item: any, idx: number) => ({
                            id: `${item.fieldKey}-${Date.now()}-${idx}`,
                            fieldKey: item.fieldKey,
                            x: item.x,
                            y: item.y,
                            page: item.page
                        }));
                        setMarkers(loadedMarkers);

                        // Also add any unknown fields to the available fields list
                        setAvailableFields(prev => {
                            const newFields = new Set(prev);
                            data.forEach((item: any) => newFields.add(item.fieldKey));
                            return Array.from(newFields);
                        });
                    }
                })
                .catch(err => console.error("Error loading mappings", err));
        }
    }, [selectedPdf]);

    // Keyboard movement for active marker
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeMarkerId) return;

            // Prevent scrolling when using arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }

            const step = e.shiftKey ? 10 : 1; // Hold shift for larger jumps

            setMarkers((prev) => prev.map(m => {
                if (m.id !== activeMarkerId) return m;
                let newX = m.x;
                let newY = m.y;
                if (e.key === 'ArrowUp') newY -= step;
                if (e.key === 'ArrowDown') newY += step;
                if (e.key === 'ArrowLeft') newX -= step;
                if (e.key === 'ArrowRight') newX += step;
                return { ...m, x: newX, y: newY };
            }));
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMarkerId]);

    const getDummyText = (key: string) => {
        const k = key.toLowerCase();
        if (k.startsWith('chk_')) return '✓';
        if (k.includes('name')) return 'Acme Corp';
        if (k.includes('address')) return '123 Business Rd, Metro Manila';
        if (k.includes('email')) return 'contact@acmecorp.com';
        if (k.includes('contact') || k.includes('phone')) return '0917-123-4567';
        if (k.includes('date')) return '2023-12-01';
        if (k.includes('count')) return '150';
        if (k.includes('signature')) return '[Signature Image]';
        if (k.includes('tin')) return '123-456-789-000';
        if (k.includes('ownership')) return 'Private';
        if (k.includes('tax')) return 'VAT-Registered';
        if (k.includes('type')) return 'Corporation';
        return `${key}`;
    };

    const handleAddField = () => {
        if (newFieldInput.trim() && !availableFields.includes(newFieldInput.trim())) {
            setAvailableFields([...availableFields, newFieldInput.trim()]);
            setNewFieldInput('');
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, field: string) => {
        setDraggedField(field);
        e.dataTransfer.setData('action', 'create');
        e.dataTransfer.setData('fieldKey', field);
    };

    const handleMarkerDragStart = (e: React.DragEvent<HTMLDivElement>, markerId: string) => {
        setActiveMarkerId(markerId);
        e.dataTransfer.setData('action', 'move');
        e.dataTransfer.setData('markerId', markerId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!overlayRef.current) return;

        const overlayRect = overlayRef.current.getBoundingClientRect();

        // Relative coordinates across the entire scrollable overlay
        const clientX = e.clientX - overlayRect.left + overlayRef.current.scrollLeft;
        const clientY = e.clientY - overlayRect.top + overlayRef.current.scrollTop;

        const action = e.dataTransfer.getData('action');

        if (action === 'create') {
            const fieldKey = e.dataTransfer.getData('fieldKey');
            const newMarker: FieldMarker = {
                id: `${fieldKey}-${Date.now()}`,
                fieldKey: fieldKey,
                x: clientX,
                y: clientY,
                page: 0
            };
            setMarkers([...markers, newMarker]);
            setActiveMarkerId(newMarker.id);
        } else if (action === 'move') {
            const markerId = e.dataTransfer.getData('markerId');
            setMarkers((prev) => prev.map(m =>
                m.id === markerId ? { ...m, x: clientX, y: clientY } : m
            ));
        }

        setDraggedField(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // allow drop
    };

    const removeMarker = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setMarkers(markers.filter(m => m.id !== id));
        if (activeMarkerId === id) setActiveMarkerId(null);
    };

    const saveMappings = async () => {
        if (!selectedPdf) return;

        // Standard A4 / Letter PDF height estimate used in pdf-lib usually spans 792 for generic forms
        // As iframe scrolling complicates exact bottom-left calculations, we save raw Overlay (X,Y)
        // and process conversion logic in the backend mapping later if precise PDF dimensions are detected.
        const finalMappings = markers.map(m => ({
            fieldKey: m.fieldKey,
            x: Math.round(m.x),
            y: Math.round(m.y), // Saving RAW overlay Y. Backend/PDF-lib will handle inversion later.
            page: m.page
        }));

        try {
            const response = await fetch('/api/admin/mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formName: selectedPdf,
                    fields: finalMappings
                })
            });

            if (response.ok) {
                alert('Mappings saved successfully to JSON!');
            } else {
                alert('Failed to save mappings.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving mappings.');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow p-4 flex justify-between items-center z-20">
                <h1 className="text-xl font-bold text-gray-800">PDF Coordinate Mapper</h1>
                <div className="flex gap-4 items-center">
                    <select
                        className="border p-2 rounded"
                        value={selectedPdf || ''}
                        onChange={(e) => setSelectedPdf(e.target.value)}
                    >
                        <option value="">Select a PDF Template...</option>
                        {PDF_TEMPLATES.map(tpl => (
                            <option key={tpl} value={tpl}>{tpl}</option>
                        ))}
                    </select>

                    <button
                        onClick={saveMappings}
                        disabled={!selectedPdf || markers.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        Save Mappings
                    </button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <aside className="w-80 bg-white border-r flex flex-col h-full overflow-hidden z-20">
                    <div className="p-4 border-b bg-gray-50 flex-none">
                        <h2 className="font-semibold text-gray-700 mb-2">Add Custom Field</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newFieldInput}
                                onChange={e => setNewFieldInput(e.target.value)}
                                placeholder="e.g. secondary_phone"
                                className="flex-1 border p-1 rounded text-sm w-full"
                                onKeyDown={e => e.key === 'Enter' && handleAddField()}
                            />
                            <button
                                onClick={handleAddField}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-medium"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <h2 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-white">Available Fields (Drag)</h2>
                        <p className="text-xs text-gray-500 mb-4">Drag these pills onto the PDF canvas.</p>
                        <div className="flex flex-col gap-2">
                            {availableFields.map(field => (
                                <div
                                    key={field}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, field)}
                                    className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-sm font-medium cursor-grab active:cursor-grabbing shadow-sm hover:shadow"
                                >
                                    {field}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Browser PDF Canvas Area */}
                <section className="flex-1 bg-gray-500 relative flex justify-center p-8 overflow-y-auto">
                    {!selectedPdf ? (
                        <div className="m-auto text-white text-lg flex items-center justify-center h-full">
                            Select a PDF from the top menu to begin mapping.
                        </div>
                    ) : (
                        <div className="relative shadow-2xl bg-white w-[850px]" style={{ height: '8500px' }}>

                            {/* Native PDF Viewer */}
                            <iframe
                                src={`/${selectedPdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                className="w-full h-full border-0 absolute inset-0 z-0 pointer-events-none"
                                title="PDF Viewer"
                            />

                            {/* Transparent Interactive Overlay */}
                            <div
                                ref={overlayRef}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => setActiveMarkerId(null)}
                                className="absolute inset-0 z-10"
                                style={{ cursor: draggedField ? 'crosshair' : 'default' }}
                            >
                                {markers.map((marker) => {
                                    const isCheckbox = marker.fieldKey.toLowerCase().startsWith('chk_');

                                    return (
                                        <div
                                            key={marker.id}
                                            draggable
                                            onDragStart={(e) => handleMarkerDragStart(e, marker.id)}
                                            onClick={(e) => { e.stopPropagation(); setActiveMarkerId(marker.id); }}
                                            className={`absolute ${isCheckbox ? 'text-lg px-1 py-0' : 'text-xs px-2 py-1'} rounded shadow-lg transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap z-20 group cursor-move ${activeMarkerId === marker.id
                                                ? 'bg-blue-600/90 text-white ring-2 ring-blue-300'
                                                : isCheckbox
                                                    ? 'bg-emerald-500/80 text-white hover:bg-emerald-600/90'
                                                    : 'bg-red-500/80 text-white hover:bg-red-600/90'
                                                }`}
                                            style={{
                                                left: `${marker.x}px`,
                                                top: `${marker.y}px`,
                                            }}
                                        >
                                            <button
                                                onClick={(e) => removeMarker(marker.id, e)}
                                                className="absolute -top-2 -right-2 bg-black text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                            <div className="font-bold flex items-center gap-1 justify-center">
                                                {getDummyText(marker.fieldKey)}
                                            </div>
                                            <div className="text-[9px] opacity-80 border-t border-white/20 mt-1 pt-0.5">
                                                {isCheckbox ? '' : `[${marker.fieldKey}] `}X:{Math.round(marker.x)} Y:{Math.round(marker.y)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
