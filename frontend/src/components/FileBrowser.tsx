import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Folder,
  File,
  FileImage,
  FileText,
  Film,
  Music,
  Archive,
  FileUnknown,
  Upload,
  ChevronRight,
  Home,
  MoreVertical,
  Download,
  Share,
  Trash2,
  FolderPlus,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  useFiles,
  useFolders,
  useDeleteFile,
  useCreateFolder,
  type File as FileType,
  type Folder as FolderType,
} from "../../hooks/useFiles";
import { useChunkedUpload } from "../../hooks/useChunkedUpload";

interface Breadcrumb {
  id: string | null;
  name: string;
}

const FileIcon = ({ mimeType, thumbnail }: { mimeType?: string; thumbnail?: string | null }) => {
  if (thumbnail) {
    return (
      <img
        src={`${import.meta.env.PUBLIC_API_URL || "http://localhost:3001"}${thumbnail}`}
        alt=""
        className="w-10 h-10 object-cover rounded"
      />
    );
  }

  if (!mimeType) return <FileUnknown className="w-10 h-10 text-muted-foreground" />;

  if (mimeType.startsWith("image/")) return <FileImage className="w-10 h-10 text-blue-500" />;
  if (mimeType.startsWith("video/")) return <Film className="w-10 h-10 text-red-500" />;
  if (mimeType.startsWith("audio/")) return <Music className="w-10 h-10 text-purple-500" />;
  if (mimeType === "application/pdf") return <FileText className="w-10 h-10 text-red-600" />;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return <Archive className="w-10 h-10 text-yellow-600" />;

  return <File className="w-10 h-10 text-gray-500" />;
};

interface FileBrowserProps {
  folderId?: string;
}

export function FileBrowser({ folderId }: FileBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(folderId);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: "Home" }]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");

  const { data: filesData, isLoading: filesLoading } = useFiles(currentFolderId);
  const { data: foldersData, isLoading: foldersLoading } = useFolders(currentFolderId);
  const { upload, uploads, isUploading } = useChunkedUpload(currentFolderId);
  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();
  const createFolder = useCreateFolder();

  const files = filesData?.files || [];
  const folders = foldersData?.folders || [];

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === "name") return a.filename.localeCompare(b.filename);
    if (sortBy === "size") return b.size - a.size;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      upload(acceptedFiles);
    },
    [upload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const navigateToFolder = (folder: FolderType) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFiles(new Set());
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id || undefined);
    setSelectedFiles(new Set());
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDownload = async (file: FileType) => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(
      `${import.meta.env.PUBLIC_API_URL || "http://localhost:3001"}/api/files/${file.id}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder.mutateAsync({ name, parentFolderId: currentFolderId });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToBreadcrumb(0)}
          >
            <Home className="w-4 h-4" />
          </Button>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToBreadcrumb(index)}
                className={index === breadcrumbs.length - 1 ? "font-semibold" : ""}
              >
                {crumb.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "date" | "size")}
            className="h-8 rounded-md border px-2 text-sm"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Enter a name for the new folder.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = new FormData(e.currentTarget).get("name") as string;
                  handleCreateFolder(name);
                }}
              >
                <Input name="name" placeholder="Folder name" className="mb-4" />
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`flex-1 p-4 ${isDragActive ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
      >
        <input {...getInputProps()} />

        {/* Upload Progress */}
        {uploads.size > 0 && (
          <div className="mb-4 space-y-2">
            {Array.from(uploads.values()).map((upload) => (
              <div key={upload.file.name} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="text-sm flex-1">{upload.file.name}</span>
                <Progress value={upload.progress} className="w-24" />
                <span className="text-xs text-muted-foreground">{upload.progress}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Folders Grid */}
        {foldersLoading || filesLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Folders */}
            {sortedFolders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Folders</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {sortedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder)}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-accent cursor-pointer group"
                    >
                      <Folder className="w-10 h-10 text-yellow-500" />
                      <span className="text-xs mt-1 text-center truncate w-full">
                        {folder.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 opacity-0 group-hover:opacity-100 absolute"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => navigateToFolder(folder)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteFolder.mutate({ folderId: folder.id })}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {sortedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Files</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {sortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-accent cursor-pointer group relative"
                    >
                      <FileIcon 
                      mimeType={file.mime_type} 
                      thumbnail={file.thumbnail_path} 
                      fileId={file.id}
                    />
                      <span className="text-xs mt-1 text-center truncate w-full">
                        {file.filename}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 opacity-0 group-hover:opacity-100 absolute top-1 right-1"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteFile.mutate({ fileId: file.id })}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {sortedFolders.length === 0 && sortedFiles.length === 0 && (
              <div className="text-center py-12">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isDragActive ? "Drop files here..." : "Drag and drop files here, or click to upload"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
