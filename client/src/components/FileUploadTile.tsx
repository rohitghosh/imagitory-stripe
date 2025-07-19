// components/story/FileUploadTile.tsx
import React, { useRef, useState } from "react";

interface Props {
  onUpload: (url: string) => void;
}

export function FileUploadTile({ onUpload }: Props) {
  const inp = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Max 5 MB");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const { url } = await res.json();
      onUpload(url);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
      if (inp.current) inp.current.value = "";
    }
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
