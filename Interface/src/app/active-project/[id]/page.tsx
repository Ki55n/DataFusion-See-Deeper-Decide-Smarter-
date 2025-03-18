"use client";

import { FileList } from "@/components/active-project-detail/FileList";
import { useState, useEffect } from "react";
import { getFilesByUserIdProjectId } from "@/db/files";
import { UserAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/active-project-detail/ChatPanel";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";

interface FileItem {
  file_uuid: string;
  name: string;
  description: string;
  size: string;
  dateUploaded: Date;
}

interface ComponentProps {
  params?: { id?: string };
}

export default function Component({ params }: ComponentProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, loading: authLoading }: any = UserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const userId = user.uid;
          const projectId = params?.id || "";
          const fetchedFiles = await getFilesByUserIdProjectId(userId, projectId);
          setFiles(fetchedFiles);
        } catch (error) {
          console.error("Error fetching files:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFiles();
  }, [params?.id, user]);

  const handleFilesSelect = (file_uuid: string[]) => {
    setSelectedFileIds(file_uuid);
  };

  const handleCleanData = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SQLITE_URL}/download_cleaned_data/${id}`, {
        method: "GET",
      });
      
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${id}.zip`;
      
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].trim();
        if (filename.startsWith('"') && filename.endsWith('"')) {
          filename = filename.substring(1, filename.length - 1);
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error cleaning data:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeData = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SQLITE_URL}/download_data_analysis/${id}`, {
        method: "GET",
      });
      
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${id}_analysis.zip`;
      
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].trim();
        if (filename.startsWith('"') && filename.endsWith('"')) {
          filename = filename.substring(1, filename.length - 1);
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error analyzing data:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="flex-grow flex flex-col">
        <header className="px-8 py-6 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Project: {params?.id || "Unknown"}
            </h1>
            <p className="text-gray-400 mt-2">
              Analyze and process your data with AI-powered tools
            </p>
          </div>
        </header>
        
        <main className="flex-grow p-8 overflow-hidden relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center space-y-4">
                <LoadingSpinner size="large" className="text-blue-500" />
                <p className="text-sm text-gray-400">Processing your request...</p>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto">
            <FileList
              files={files}
              onFilesSelect={handleFilesSelect}
              onCleanData={handleCleanData}
              onAnalyzeData={handleAnalyzeData}
            />
          </div>
        </main>
      </div>
      
      <ChatInterface
        selectedFileIds={selectedFileIds}
        files={files}
        project_uuid={params?.id || ""}
      />
    </div>
  );
}
