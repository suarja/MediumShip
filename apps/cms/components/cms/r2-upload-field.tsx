"use client";

import { useUploadFile } from "@convex-dev/r2/react";
import { useConvex } from "convex/react";
import { useRef, useState, type ChangeEvent } from "react";

import { api } from "../../../../convex/_generated/api";

type R2UploadFieldProps = {
  label: string;
  // Narrow the picker + thumbnail rendering.
  kind: "image" | "video";
  // MIME accept attribute, e.g. "image/*" or "video/*".
  accept: string;
  // Currently-stored URL (heroImageUrl / playbackUrl) for the form thumbnail.
  currentUrl: string;
  hint?: string;
  // Called with the R2 object key and the resolved playable/renderable URL.
  onUploaded: (key: string, url: string) => void;
};

// Uploads a file to R2 via the admin-guarded `useUploadFile(api.media.r2)` hook
// (mirrors Editia's lesson-cover-uploader), then resolves the returned key to a
// URL with `getKeyUrl` so the caller can persist a stable source. Used by the
// content form for hosted-video files and cover images, replacing the
// paste-a-URL inputs.
export function R2UploadField({
  label,
  kind,
  accept,
  currentUrl,
  hint,
  onUploaded,
}: R2UploadFieldProps) {
  const uploadFile = useUploadFile(api.media.r2);
  const convex = useConvex();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const key = await uploadFile(file);
      const url = await convex.query(api.media.r2.getKeyUrl, { key });
      if (!url) {
        throw new Error("missing-url");
      }
      onUploaded(key, url);
    } catch {
      setError(
        "Échec de l’upload. Vérifie les variables R2 sur le déploiement Convex.",
      );
    } finally {
      setUploading(false);
    }
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    event.target.value = "";
  };

  return (
    <div className="field field--wide">
      <span className="field__lbl">{label}</span>
      <div className="upload">
        {kind === "image" ? (
          <div
            className="upload__thumb"
            style={
              currentUrl
                ? {
                    backgroundImage: `url("${currentUrl}")`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
          />
        ) : (
          <div className="upload__thumb" aria-hidden>
            {currentUrl ? (
              <video
                src={currentUrl}
                muted
                playsInline
                preload="metadata"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                }}
              />
            ) : (
              <span style={{ display: "grid", placeItems: "center", height: "100%" }}>
                ▶
              </span>
            )}
          </div>
        )}
        <div className="upload__meta">
          <h5 className="upload__t">
            {uploading
              ? "Upload en cours…"
              : currentUrl
                ? "Fichier hébergé sur R2"
                : "Aucun fichier — uploader vers R2"}
          </h5>
          <div className="upload__d">
            {error ?? hint ?? "Upload privé R2, admin uniquement."}
          </div>
          <button
            className="btn btn--surface btn--sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            style={{ marginTop: 8 }}
            type="button"
          >
            {uploading
              ? "Upload…"
              : currentUrl
                ? "Remplacer le fichier"
                : "Choisir un fichier"}
          </button>
        </div>
      </div>
      <input
        accept={accept}
        hidden
        onChange={onPick}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
