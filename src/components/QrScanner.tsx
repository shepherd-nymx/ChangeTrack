import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw, X, AlertCircle, Sparkles } from 'lucide-react';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  sampleChangeIds?: string[];
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan, onClose, sampleChangeIds = ['CT-48291', 'CT-39104', 'CT-51820'] }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable in iframe:', err);
      setCameraError('Camera access unavailable or blocked in this browser preview. You can use the Quick Test QR triggers below or type the Change ID directly.');
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            // Found QR code
            stopCamera();
            onScan(code.data);
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  };

  const handleSimulateScan = (id: string) => {
    stopCamera();
    onScan(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Scan Customer QR Code</h3>
              <p className="text-xs text-slate-500">Hold customer's phone or receipt to the camera</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-ink-400 hover:text-ink-700 rounded-lg hover:bg-ink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 relative overflow-hidden rounded-xl bg-ink-900 aspect-square flex flex-col items-center justify-center">
          {!cameraError ? (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64 border-2 border-emerald-400 rounded-xl bg-emerald-500/5 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />

                  {/* Laser line animation */}
                  <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-white space-y-3">
              <div className="inline-flex p-3 rounded-full bg-amber-500/20 text-amber-300">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-xs text-ink-300 max-w-xs mx-auto leading-relaxed">
                {cameraError}
              </p>
            </div>
          )}
        </div>

        {/* Quick simulator buttons */}
        <div className="mt-4 pt-3 border-t border-ink-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Instant Test Triggers (Simulate QR Scan):</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sampleChangeIds.map(id => (
              <button
                key={id}
                onClick={() => handleSimulateScan(id)}
                className="px-2.5 py-2 text-xs font-mono font-semibold rounded-lg border border-ink-200 bg-ink-50 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 text-ink-700 transition-all text-center"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full py-2.5 text-sm font-semibold text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
