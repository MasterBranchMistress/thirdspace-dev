"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Lottie from "lottie-react";
import upload from "@/public/lottie/upload.json";

export default function EventAttachmentUploader({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void; // parent handles upload
}) {
  const [attachments, setAttachments] = useState<
    { url: string; type: string }[]
  >([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
      "video/*": [],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newAttachments = acceptedFiles.map((file) => ({
          url: URL.createObjectURL(file),
          type: file.type,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
        onFilesSelected(acceptedFiles);
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full">
      <div
        {...getRootProps()}
        className={`w-full p-6 border-2 border-dashed rounded-lg 
        flex flex-col items-center justify-center text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-purple-50/10" : "border-secondary"}
      `}
      >
        <Lottie
          animationData={upload}
          style={{ width: "8rem", marginTop: "-2rem", marginBottom: "-1rem" }}
        />
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-secondary">Drop your photos or videos here!</p>
        ) : (
          <p className="text-secondary">
            Drag & drop photos/videos, or click to select
          </p>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {attachments.map((attachment, i) => (
            <div key={i} className="relative">
              {attachment.type.startsWith("image/") ? (
                <img
                  src={attachment.url}
                  alt={`Attachment ${i}`}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-concrete"
                />
              ) : attachment.type.startsWith("video/") ? (
                <video
                  src={attachment.url}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-concrete"
                  controls
                />
              ) : (
                <p className="text-xs text-secondary">Unsupported file</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
