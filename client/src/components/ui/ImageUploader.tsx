import { useRef, useState, useCallback, DragEvent, ClipboardEvent } from 'react';
import { UploadCloud, X, Image, Link } from 'lucide-react';
import { clsx } from 'clsx';
import { imgSrc } from '@/lib/imageUrl';

interface Props {
  value: string;          // data-url, http url ou vide
  onChange: (value: string) => void;
  onClear: () => void;
  label?: string;
  maxWidthPx?: number;    // resize max largeur (défaut 1200)
  quality?: number;       // 0-1 (défaut 0.82)
}

type Tab = 'upload' | 'url';

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
  // If current value is a URL (not base64), start on url tab
  const isUrl = value.startsWith('http://') || value.startsWith('https://');
  const [tab, setTab] = useState<Tab>(isUrl ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(isUrl ? value : '');
  const [urlError, setUrlError] = useState(false);

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

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { onClear(); setUrlError(false); return; }
    if (!trimmed.startsWith('https://')) {
      setUrlError(true); return;
    }
    setUrlError(false);
    onChange(trimmed);
  };

  const handleClear = () => {
    onClear();
    setUrlInput('');
    setUrlError(false);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    // Clear value when switching tabs so there's no stale image
    if (value) handleClear();
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      {/* Preview */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group mb-2">
          <img src={imgSrc(value)} alt="" className="w-full h-36 object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tab switcher */}
      {!value && (
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => switchTab('upload')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-colors',
              tab === 'upload' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50',
            )}
          >
            <UploadCloud size={12} /> Importer
          </button>
          <button
            type="button"
            onClick={() => switchTab('url')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-colors border-l border-gray-200',
              tab === 'url' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50',
            )}
          >
            <Link size={12} /> URL
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!value && tab === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          onClick={() => inputRef.current?.click()}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className={clsx(
            'flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all outline-none',
            dragging
              ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
              : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50',
            loading && 'pointer-events-none opacity-60'
          )}
        >
          {loading ? (
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          ) : (
            <>
              <div className="p-2 bg-gray-100 rounded-lg">
                {dragging ? <UploadCloud size={18} className="text-indigo-600" /> : <Image size={18} className="text-gray-400" />}
              </div>
              <p className="text-xs text-gray-500 text-center">
                Glisser-déposer, <span className="text-indigo-600 underline">parcourir</span> ou coller
              </p>
            </>
          )}
        </div>
      )}

      {/* URL input zone */}
      {!value && tab === 'url' && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(false); }}
              onKeyDown={e => e.key === 'Enter' && applyUrl()}
              onBlur={applyUrl}
              placeholder="https://example.com/image.jpg"
              className={clsx(
                'flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-colors',
                urlError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200',
              )}
            />
          </div>
          {urlError && (
            <p className="text-xs text-red-500">URL invalide — doit commencer par https://</p>
          )}
          <p className="text-xs text-gray-400">L'image sera chargée depuis cette URL dans les sessions.</p>
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
