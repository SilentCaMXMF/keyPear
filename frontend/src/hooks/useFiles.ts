import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface File {
  id: string;
  user_id: string;
  folder_id: string | null;
  filename: string;
  storage_path: string;
  thumbnail_path: string | null;
  size: number;
  mime_type: string;
  checksum: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Folder {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  name: string;
  created_at: string;
  deleted_at: string | null;
}

export function useFiles(folderId?: string) {
  return useQuery({
    queryKey: ["files", folderId],
    queryFn: () =>
      api.get<{ files: File[] }>(
        `/api/files${folderId ? `?folderId=${folderId}` : ""}`
      ),
  });
}

export function useFolders(folderId?: string) {
  return useQuery({
    queryKey: ["folders", folderId],
    queryFn: () =>
      api.get<{ folders: Folder[] }>(
        `/api/folders${folderId ? `?folderId=${folderId}` : ""}`
      ),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folderId,
    }: {
      file: File;
      folderId?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) formData.append("folderId", folderId);

      return api.post<{ file: File }>("/api/files/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      parentFolderId,
    }: {
      name: string;
      parentFolderId?: string;
    }) =>
      api.post<{ folder: Folder }>("/api/folders", {
        name,
        parentFolderId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      permanent = false,
    }: {
      fileId: string;
      permanent?: boolean;
    }) =>
      api.delete(`/api/files/${fileId}${permanent ? "?permanent=true" : ""}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      folderId,
      permanent = false,
    }: {
      folderId: string;
      permanent?: boolean;
    }) =>
      api.delete(`/api/folders/${folderId}${permanent ? "?permanent=true" : ""}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) =>
      api.post(`/api/files/${fileId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useCreateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      expiresIn,
    }: {
      fileId: string;
      expiresIn?: number;
    }) => api.post<{ share: { token: string } }>("/api/shares", { fileId, expiresIn }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares"] });
    },
  });
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  file_id: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function useActivityLogs(limit = 50) {
  return useQuery({
    queryKey: ["activityLogs", limit],
    queryFn: () => api.get<{ logs: ActivityLog[] }>(`/api/logs?limit=${limit}`),
  });
}
