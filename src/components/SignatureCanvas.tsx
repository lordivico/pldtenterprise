'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'react-signature-canvas';

interface SignatureCanvasProps {
    value?: string;
    onChange: (base64: string) => void;
    error?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ value, onChange, error }) => {
    const sigPadRef = useRef<SignaturePad>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasWidth, setCanvasWidth] = useState(500);

    // Resize canvas on mount/window resize
    useEffect(() => {
        const resizeCanvas = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setCanvasWidth(width);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Handle clearing
    const clear = () => {
        sigPadRef.current?.clear();
        onChange('');
    };

    // Handle drawing end
    const onEnd = () => {
        if (sigPadRef.current) {
            if (sigPadRef.current.isEmpty()) {
                onChange('');
            } else {
                // Returns base64 string
                const base64 = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
                onChange(base64);
            }
        }
    };

    return (
        <div className="w-full space-y-2" ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700">Digital Signature</label>

            <div className={`border rounded-md overflow-hidden bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}>
                <SignaturePad
                    ref={sigPadRef}
                    canvasProps={{
                        width: canvasWidth,
                        height: 200,
                        className: 'cursor-crosshair bg-gray-50'
                    }}
                    onEnd={onEnd}
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
                type="button"
                onClick={clear}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
                Clear Signature
            </button>
        </div>
    );
};

export default SignatureCanvas;
