"use client";

import { FileList } from "@/components/active-project-detail/FileList";
import { useState, useEffect } from "react";
import { getFilesByUserIdProjectId } from "@/db/files";
import { UserAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/active-project-detail/ChatPanel";

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
  const { user, loading: authLoading }: any = UserAuth(); // Use 'loading' from auth context
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login"); // Redirect to the login page if not authenticated
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // console.log(user.uid);
    // console.log("first");
    const fetchFiles = async () => {
      if (user) {
        const userId = user.uid; // Replace with actual user ID
        const projectId = params?.id || "";
        const fetchedFiles = await getFilesByUserIdProjectId(userId, projectId);
        setFiles(fetchedFiles);
      }
    };

    fetchFiles();
  }, [params?.id, user]);

  const handleFilesSelect = (file_uuid: string[]) => {
    setSelectedFileIds(file_uuid);
  };

  const handleCleanData = (id: string) => {
    fetch(`${process.env.NEXT_PUBLIC_SQLITE_URL}/download_cleaned_data/${id}`, {
      method: "GET",
    }).then((response) => {
      // Get the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");

      // Default filename fallback based on the id
      let filename = `${id}.zip`;

      // Extract the filename from the Content-Disposition header, if it exists
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].trim();

        // Remove surrounding quotes from the filename if they exist
        if (filename.startsWith('"') && filename.endsWith('"')) {
          filename = filename.substring(1, filename.length - 1);
        }
      }

      // Process the blob and trigger the download with the correct filename
      response.blob().then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename; // Use the extracted filename
        a.click();
        window.URL.revokeObjectURL(url); // Clean up the URL object
      });
    });
  };

  const handleAnalyzeData = (id: string) => {
    fetch(
      `${process.env.NEXT_PUBLIC_SQLITE_URL}/download_data_analysis/${id}`,
      {
        method: "GET",
      }
    ).then((response) => {
      // Get the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");

      // Default filename fallback based on the id
      let filename = `${id}_analysis.zip`;

      // Extract the filename from the Content-Disposition header, if it exists
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].trim();

        // Remove surrounding quotes from the filename if they exist
        if (filename.startsWith('"') && filename.endsWith('"')) {
          filename = filename.substring(1, filename.length - 1);
        }
      }

      // Process the blob and trigger the download with the correct filename
      response.blob().then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename; // Use the extracted filename
        a.click();
        window.URL.revokeObjectURL(url); // Clean up the URL object
      });
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <div className="flex-grow flex flex-col">
        <header className="px-6 py-4 bg-gray-800">
          <h1 className="text-2xl font-bold">
            Project: {params?.id || "Unknown"} Dashboard
          </h1>
        </header>
        <main className="flex-grow p-6 overflow-hidden">
          <FileList
            files={files}
            onFilesSelect={handleFilesSelect}
            onCleanData={handleCleanData}
            onAnalyzeData={handleAnalyzeData}
          />
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
