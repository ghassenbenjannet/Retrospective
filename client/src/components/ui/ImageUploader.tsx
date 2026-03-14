import { useRef, useState, useCallback, DragEvent, ClipboardEvent } from 'react';
import { UploadCloud, X, Image } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  value: string;          // data-url ou url http
  onChange: (dataUrl: string) => void;
  onClear: () => void;
  label?: string;
  maxWidthPx?: number;    // resize max largeur (défaut 1200)
  quality?: number;       // 0-1 (défaut 0.82)
}

function resizeAndCompress(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({ value, onChange, onClear, label, maxWidthPx = 1200, quality = 0.82 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      const dataUrl = await resizeAndCompress(file, maxWidthPx, quality);
      onChange(dataUrl);
    } finally {
      setLoading(false);
    }
  }, [maxWidthPx, quality, onChange]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(e.clipboardData.items)
      .find(i => i.type.startsWith('image/'))
      ?.getAsFile();
    if (file) processFile(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="" className="w-full h-36 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
          >
            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full transition-opacity">
              Changer l'image
            </span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          onClick={() => inputRef.current?.click()}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className={clsx(
            'flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all outline-none',
            dragging
              ? 'border-primary-500 bg-primary-50 scale-[1.01]'
              : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50',
            loading && 'pointer-events-none opacity-60'
          )}
        >
          {loading ? (
            <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
          ) : (
            <>
              <div className="p-2 bg-gray-100 rounded-lg">
                {dragging ? <UploadCloud size={20} className="text-primary-600" /> : <Image size={20} className="text-gray-400" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Glisser-déposer, <span className="text-primary-600 underline">parcourir</span> ou coller
                </p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · compressé automatiquement</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInput}
      />
    </div>
  );
}
