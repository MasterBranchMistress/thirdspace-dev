"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Lottie from "lottie-react";
import upload from "@/public/lottie/upload.json";

export default function AvatarUploader({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void; // parent handles upload
}) {
  const [preview, setPreview] = useState<string | null>(null);

  // Setup Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setPreview(URL.createObjectURL(file));
        onFileSelected(file);
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
          <p className="text-secondary">Drop your avatar here!</p>
        ) : (
          <p className="text-secondary">
            Drag & drop an avatar, or click to select
          </p>
        )}
      </div>

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="h-30 w-30 rounded-full object-cover mt-4 border-2 border-concrete"
        />
      )}
    </div>
  );
}
