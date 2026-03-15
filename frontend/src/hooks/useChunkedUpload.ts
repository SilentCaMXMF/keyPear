import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useFiles } from "./useFiles";

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export function useChunkedUpload(folderId?: string) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const { refetch } = useFiles(folderId);

  const uploadFile = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const fileSize = file.size;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

      const updateProgress = (chunk: number, status: UploadProgress["status"]) => {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(file.name, {
            file,
            progress: Math.round((chunk / totalChunks) * 100),
            status,
          });
          return next;
        });
      };

      const arrayBuffer = await file.arrayBuffer();
      const chunks: Blob[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        chunks.push(new Blob([arrayBuffer.slice(start, end)]));
      }

      let uploadId: string | undefined;
      for (let i = 0; i < totalChunks; i++) {
        const chunkFormData = new FormData();
        chunkFormData.append("chunk", chunks[i]);
        chunkFormData.append("chunkNumber", String(i));
        chunkFormData.append("totalChunks", String(totalChunks));
        chunkFormData.append("filename", file.name);
        chunkFormData.append("totalSize", String(fileSize));
        chunkFormData.append("mimeType", file.type || "application/octet-stream");
        if (folderId) chunkFormData.append("folderId", folderId);

        if (uploadId) {
          chunkFormData.append("uploadId", uploadId);
        }

        const response = await api.post<{ uploadId: string }>(
          "/api/files/chunks/upload/chunk",
          chunkFormData
        );
        uploadId = response.uploadId;
        updateProgress(i + 1, "uploading");
      }

      const completeFormData = new FormData();
      completeFormData.append("uploadId", uploadId!);

      const { file: uploadedFile } = await api.post<{ file: unknown }>(
        "/api/files/chunks/upload/complete",
        completeFormData
      );

      updateProgress(totalChunks, "complete");
      return uploadedFile;
    },
    onSuccess: () => {
      refetch();
      setTimeout(() => {
        setUploads((prev) => {
          const next = new Map(prev);
          next.delete("complete");
          return next;
        });
      }, 2000);
    },
    onError: (error: Error) => {
      setUploads((prev) => {
        const next = new Map(prev);
        const upload = next.get(error.message);
        if (upload) {
          next.set(upload.file.name, { ...upload, status: "error", error: error.message });
        }
        return next;
      });
    },
  });

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(file.name, { file, progress: 0, status: "pending" });
          return next;
        });
        await uploadFile.mutateAsync({ file });
      }
    },
    [uploadFile]
  );

  return { upload, uploads, isUploading: uploadFile.isPending };
}
