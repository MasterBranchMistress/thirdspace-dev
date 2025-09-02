"use client";

import Lottie from "lottie-react";
import upload from "@/public/lottie/upload.json";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function EventAttachmentUploader({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const [previews, setPreviews] = useState<
    { url: string; type: string; file: File }[]
  >([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "video/*": [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newPreviews = acceptedFiles.map((f) => ({
          url: URL.createObjectURL(f),
          type: f.type,
          file: f,
        }));
        setPreviews((prev) => [...prev, ...newPreviews]);
        onFilesSelected(acceptedFiles); // pass files up
      }
    },
  });

  const handleRemove = (index: number) => {
    setPreviews((prev) => {
      const newList = [...prev];
      const [removed] = newList.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url); // cleanup blob
      return newList;
    });
  };

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed p-6 flex flex-col justify-center items-center rounded-lg text-center cursor-pointer"
    >
      <Lottie
        animationData={upload}
        style={{ width: "12rem", marginTop: "-2rem", marginBottom: "-1rem" }}
      />
      <input {...getInputProps()} />
      <p className="font-extralight tracking-tight">
        {isDragActive ? "Drop files…" : "Drag & drop or click to select"}
      </p>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {previews.map((file, i) => (
            <div key={i} className="relative group">
              {file.type.startsWith("image/") ? (
                <img
                  src={file.url}
                  className="h-60 w-auto object-cover rounded-lg border"
                  alt={`preview-${i}`}
                />
              ) : file.type.startsWith("video/") ? (
                <video
                  src={file.url}
                  className="h-60 w-auto rounded-lg border"
                  controls
                />
              ) : (
                <p className="text-xs text-secondary">Unsupported file</p>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering dropzone click
                  handleRemove(i);
                }}
                className="absolute top-2 right-2 bg-black/20 border-1 border-concrete backdrop-blur-2xl text-white rounded-full p-0.5"
              >
                <XMarkIcon width={12} height={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
