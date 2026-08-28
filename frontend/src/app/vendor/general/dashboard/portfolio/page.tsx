"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5510";
const MAX_UPLOAD = 10; // max files per upload batch

type GalleryImage = {
  url: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SpinIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images,     setImages]     = useState<GalleryImage[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [files,      setFiles]      = useState<File[]>([]);

  useEffect(() => { document.title = "Portfolio — Event Ease"; }, []);

  // Fetch gallery from profile
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api.get<{ vendor: { galleryImages: string[] } }>("/api/vendor/profile", accessToken)
      .then(res => {
        if (res.success) {
          const imgs = res.vendor?.galleryImages ?? [];
          setImages(imgs.map(url => ({ url })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_UPLOAD);
    if (!selected.length) return;
    setFiles(selected);
    const urls = selected.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }

  function clearSelection() {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!files.length || !accessToken) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      const res = await fetch(`${API_BASE}/api/vendor/upload/gallery`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body:    formData,
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? "Upload failed.");
        return;
      }
      // Refresh gallery
      const profileRes = await api.get<{ vendor: { galleryImages: string[] } }>("/api/vendor/profile", accessToken);
      if (profileRes.success) {
        setImages((profileRes.vendor?.galleryImages ?? []).map(url => ({ url })));
      }
      setSuccess(`${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully.`);
      clearSelection();
    } catch {
      setError("Could not connect to server.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(url: string) {
    if (!accessToken) return;
    setDeleting(url);
    setError("");
    try {
      const res = await api.post<{ galleryImages: string[] }>(
        "/api/vendor/upload/gallery/delete",
        { url },
        accessToken,
      );
      if (res.success) {
        const updated = res.galleryImages ?? images.filter(i => i.url !== url).map(i => i.url);
        setImages(updated.map(u => ({ url: u })));
        setDeleteTarget(null);
      } else {
        setError("Failed to delete image.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Portfolio</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          Manage your gallery images — upload new photos and remove old ones.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#F0FDF4", color: "#15803D" }}>
          {success}
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-black mb-4">Upload Images</h2>

        {previews.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 py-12 transition-colors cursor-pointer hover:border-[var(--primary)]"
            style={{ borderColor: "#D1D5DB", color: "var(--fg-muted)" }}
          >
            <UploadIcon />
            <div className="text-center">
              <p className="text-sm font-semibold">Click to select images</p>
              <p className="text-xs mt-1">PNG, JPG, WEBP — up to {MAX_UPLOAD} at once</p>
            </div>
          </button>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden" style={{ background: "#F4F4F5" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearSelection}
                disabled={uploading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 disabled:opacity-50 transition-opacity"
                style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                {uploading ? <><SpinIcon /> Uploading…</> : `Upload ${files.length} Image${files.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Gallery Grid */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-black">Gallery ({images.length})</h2>
          {images.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: "var(--primary-light)", color: "var(--primary)" }}
            >
              + Add More
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: "#E5E7EB" }} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#F4F4F5", color: "var(--fg-muted)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <p className="text-sm font-semibold text-black">No images yet</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Upload your first photos to showcase your work</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              Upload Images
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.url} className="relative aspect-square rounded-xl overflow-hidden group" style={{ background: "#F4F4F5" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="Gallery"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setDeleteTarget(img.url)}
                    className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    style={{ background: "#DC2626", color: "#fff" }}
                    title="Delete image"
                  >
                    <TrashIcon />
                  </button>
                </div>
                {deleting === img.url && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <SpinIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[320px] shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
              <TrashIcon />
            </div>
            <p className="text-base font-bold text-black text-center">Delete Image?</p>
            <p className="text-sm text-center mt-1 mb-5" style={{ color: "var(--fg-muted)" }}>
              This image will be permanently removed from your gallery.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={!!deleting}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-80 disabled:opacity-50"
                style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={!!deleting}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: "#DC2626", color: "#fff" }}
              >
                {deleting ? <><SpinIcon /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
