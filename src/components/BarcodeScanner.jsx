import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, Loader2, AlertCircle } from 'lucide-react';

/**
 * Full-screen barcode scanner using the device camera.
 * Calls onScan(barcodeText) when a code is detected.
 * Calls onClose() when the user dismisses.
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef  = useRef(null);
  const readerRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');
  const scannedRef = useRef(false); // prevent multiple fires

  const handleResult = useCallback((result) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    onScan(result.getText());
  }, [onScan]);

  useEffect(() => {
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) handleResult(result);
        // err fires every frame when no barcode found — silently ignore
      })
      .then(() => {
        setStatus('scanning');
      })
      .catch((e) => {
        const msg = e?.message || '';
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setErrorMsg('Camera access was denied. Please allow camera access in your browser settings and try again.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setErrorMsg('No camera found on this device.');
        } else {
          setErrorMsg('Could not start the camera. Try refreshing the page.');
        }
        setStatus('error');
      });

    return () => {
      try { readerRef.current?.reset(); } catch {}
    };
  }, [handleResult]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
        <div className="flex flex-col">
          <h2 className="text-white font-bold text-base">Scan Barcode</h2>
          <p className="text-white/60 text-xs mt-0.5">Point camera at a product barcode</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Close scanner"
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan frame overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Dim overlay around frame */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Frame cutout (visual only) */}
            <div className="relative w-72 h-44 z-10">
              {/* Corner marks */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
                const isTop    = corner.startsWith('top');
                const isLeft   = corner.endsWith('left');
                return (
                  <div
                    key={corner}
                    className="absolute w-8 h-8"
                    style={{
                      top:    isTop    ? 0 : undefined,
                      bottom: !isTop   ? 0 : undefined,
                      left:   isLeft   ? 0 : undefined,
                      right:  !isLeft  ? 0 : undefined,
                      borderTop:    isTop  ? '3px solid #4F46E5' : undefined,
                      borderBottom: !isTop ? '3px solid #4F46E5' : undefined,
                      borderLeft:   isLeft  ? '3px solid #4F46E5' : undefined,
                      borderRight:  !isLeft ? '3px solid #4F46E5' : undefined,
                      borderTopLeftRadius:     (isTop && isLeft)   ? 4 : undefined,
                      borderTopRightRadius:    (isTop && !isLeft)  ? 4 : undefined,
                      borderBottomLeftRadius:  (!isTop && isLeft)  ? 4 : undefined,
                      borderBottomRightRadius: (!isTop && !isLeft) ? 4 : undefined,
                    }}
                  />
                );
              })}
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-brand opacity-80 animate-scan-line" />
            </div>
          </div>
        )}

        {/* Starting state */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-white animate-spin" />
            <p className="text-white/70 text-sm">Starting camera…</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-white text-center text-sm leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {status === 'scanning' && (
        <div className="px-6 py-5 flex-shrink-0 text-center">
          <p className="text-white/50 text-xs">
            Supports UPC-A, UPC-E, EAN-13, EAN-8, QR codes and more
          </p>
        </div>
      )}
    </div>
  );
}
