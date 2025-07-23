// components/story/FileUploadTile.tsx
import React, { useRef, useState } from "react";

interface Props {
  onUpload: (url: string) => void;
  onStart?: () => void;
  onProgress?: (pct: number) => void;
}

export function FileUploadTile({ onUpload, onStart, onProgress }: Props) {
  const inp = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Max 5 MB");

    setLoading(true);
    onStart?.(); // NEW

    const fd = new FormData();
    fd.append("file", file);

    const xhr = new XMLHttpRequest(); // NEW: need progress events
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = (ev.loaded / ev.total) * 100;
        onProgress?.(pct); // NEW
      }
    };

    xhr.onload = () => {
      try {
        const { url } = JSON.parse(xhr.responseText);
        onUpload(url);
      } catch {
        alert("Upload failed");
      } finally {
        setLoading(false);
        onProgress?.(100); // ensure bar hits 100%
        if (inp.current) inp.current.value = "";
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      alert("Upload failed");
      if (inp.current) inp.current.value = "";
    };

    xhr.send(fd);
  };

  return (
    <button
      type="button"
      className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400"
      onClick={() => inp.current?.click()}
      disabled={loading}
    >
      {loading ? (
        <span className="loader">…</span>
      ) : (
        <span className="text-2xl">＋</span>
      )}
      <input
        ref={inp}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFile}
      />
    </button>
  );
}
