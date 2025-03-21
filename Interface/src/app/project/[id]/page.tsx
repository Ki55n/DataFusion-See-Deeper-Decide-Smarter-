"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon, Trash2Icon, UploadIcon, DownloadIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import { FileUploadPopup } from "@/components/shared/FileUploadPopup";
import { getFilesByProjectId, deleteFile } from "@/services/fileService";
import { FileDTO } from "@/types";

interface FileItem {
  id: string;
  file_uuid: string;
  name: string;
  description: string;
  size: string;
  uploadDate: Date;
  file_path?: string;
}

async function getProjectFiles(projectId: string): Promise<FileItem[]> {
  try {
    if (!projectId) {
      throw new Error("Invalid projectId");
    }
    console.log("Fetching files for project:", projectId);

    const files = await getFilesByProjectId(projectId);
    console.log("Files fetched successfully:", files);

    return files.map((file: FileDTO) => ({
      id: file.id,
      file_uuid: file.file_uuid,
      name: file.name,
      description: file.description || "",
      size: file.size.toString(),
      uploadDate: file.dateUploaded,
      file_path: file.file_path || undefined,
    }));
  } catch (error) {
    console.error("Error fetching project files:", error);
    throw error;
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { user, loading: authLoading }: any = UserAuth();
  const router = useRouter();

  const [projectName, setProjectName] = useState<string>("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login"); // Redirect to the login page if not authenticated
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        if (!user?.uid) {
          console.error("User is not authenticated");
          return;
        }

        console.log("Fetching project details for project:", params.id);

        const projectFiles = await getFilesByProjectId(params.id);
        const mappedFiles = projectFiles.map((file: FileDTO) => ({
          id: file.id,
          file_uuid: file.file_uuid,
          name: file.name,
          description: file.description || "",
          size: file.size.toString(),
          uploadDate: file.dateUploaded,
          file_path: file.file_path || undefined,
        }));
        setFiles(mappedFiles);
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };

    fetchProjectDetails();
  }, [params.id, user]);

  const removeFile = async (id: string) => {
    try {
      const success = await deleteFile(id);
      if (success) {
        setFiles(files.filter((file) => file.id !== id));
      } else {
        console.error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const addNewFile = (newFile: FileItem) => {
    setFiles([newFile, ...files]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="px-6 py-4 bg-gray-800">
        <h1 className="text-2xl font-bold">Project: {projectName} Dashboard</h1>
      </header>
      <main className="flex-grow p-6 overflow-hidden">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Uploaded Files</h2>
          <Button
            onClick={() => setIsUploadPopupOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Add New File
          </Button>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between text-sm font-medium text-gray-400">
            <span className="w-2/5">Name</span>
            <span className="w-1/5">Description</span>
            <span className="w-1/5 text-right">Size</span>
            <span className="w-1/5 text-right">Upload Date</span>
            <span className="w-1/5"></span>
          </div>
          <ScrollArea className="h-[calc(100vh-250px)]">
            {files.map((file) => (
              <div
                key={file.file_uuid}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-700 transition-colors duration-150"
              >
                <div className="flex items-center w-2/5">
                  <FileIcon className="mr-3 h-5 w-5 text-blue-400" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <span className="w-1/5 text-gray-400">{file.description}</span>
                <span className="w-1/5 text-right text-gray-400">
                  {(parseInt(file.size) / 1000).toFixed(2)} KB
                </span>
                <span className="w-1/5 text-right text-gray-400">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </span>
                <div className="w-1/5 text-right flex items-center justify-end space-x-2">
                  {file.file_path && (
                    <a
                      href={file.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/20"
                      >
                        <DownloadIcon className="h-5 w-5" />
                        <span className="sr-only">Download file</span>
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                  >
                    <Trash2Icon className="h-5 w-5" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </main>
      <FileUploadPopup
        isOpen={isUploadPopupOpen}
        onClose={() => setIsUploadPopupOpen(false)}
        onUpload={addNewFile}
        projectId={params.id}
        user={user}
      />
    </div>
  );
}
