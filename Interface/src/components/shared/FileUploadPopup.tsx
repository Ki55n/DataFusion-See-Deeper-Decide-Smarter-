"use client";

import { uploadFile } from "@/services/fileService";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import supabase from "@/lib/supabase";
import { changeProjectStatus } from "@/db/project";

interface FileItem {
  id: string;
  file_uuid: string;
  name: string;
  description: string;
  size: string;
  uploadDate: Date;
  file_path?: string;
}

async function uploadAndSaveFile(
  file: File,
  name: string,
  description: string,
  projectId: string,
  userId: string
) {
  try {
    // Upload file to SQLite server
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SQLITE_URL}/upload-file`,
      {
        method: "POST",
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error("File upload failed");
    }
    
    const data = await response.json();
    console.log("File upload response:", data);

    // Set project status to inactive during processing
    await changeProjectStatus(projectId, "inactive");

    // Upload file to Supabase Storage
    const fileExtension = file.name.split('.').pop();
    const filePath = `${projectId}/${data.file_uuid}.${fileExtension}`;
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);
    
    const downloadURL = publicUrlData.publicUrl;
    console.log("File uploaded to Supabase Storage:", downloadURL);

    // Save file metadata to Postgres using Prisma
    const fileData = await uploadFile(
      userId,
      projectId,
      description,
      {
        name: name,
        size: file.size,
        file_uuid: data.file_uuid,
        file_path: downloadURL // Store Supabase Storage URL
      }
    );

    return {
      id: fileData?.id || "",
      file_uuid: data.file_uuid,
      name: name,
      description: description || "",
      size: file.size.toString(),
      uploadDate: new Date(),
      file_path: downloadURL
    };
  } catch (error) {
    console.error("Error occurred during file upload:", error);
    throw error;
  }
}

function FileDragAndDrop({
  onDrop,
  fileName,
}: {
  onDrop: (file: File) => void;
  fileName: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    onDrop(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <input
        id="fileInput"
        type="file"
        className="hidden"
        onChange={(e) => e.target.files && onDrop(e.target.files[0])}
      />
      {fileName ? (
        <p>{fileName}</p>
      ) : (
        <p>Drag and drop a file here, or click to select a file</p>
      )}
    </div>
  );
}

export function FileUploadPopup({
  isOpen,
  onClose,
  onUpload,
  projectId,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: FileItem) => void;
  projectId: string;
  user: any;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ name?: string; file?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (user: any) => {
    setErrors({});
    if (!name) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }));
      return;
    }
    if (!file) {
      setErrors((prev) => ({ ...prev, file: "File is required" }));
      return;
    }

    setIsLoading(true);
    try {
      const uploadedFile = await uploadAndSaveFile(
        file,
        name,
        description,
        projectId,
        user.uid
      );
      onUpload(uploadedFile);
      onClose();
    } catch (error) {
      console.error("Error uploading file:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 bg-black/60 inset-0 flex justify-center items-center">
      <div className="relative bg-gray-900 text-white rounded-2xl p-[max(2vw,2rem)] w-[35vw] h-auto max-h-[90%] overflow-y-auto shadow-lg">
        <button
          className="absolute top-[20px] right-[20px] hover:text-gray-400 transition-colors"
          onClick={onClose}
        >
          <XIcon />
        </button>
        <h2 className="font-bold text-left text-[22px] mb-8 capitalize">
          Add New File
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(user);
          }}
        >
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Name
            </label>
            <Input
              type="text"
              id="name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition"
            />
            {errors.name && (
              <span className="text-red-500 text-sm">{errors.name}</span>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description
            </label>
            <Input
              type="text"
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Upload File
            </label>
            <FileDragAndDrop
              onDrop={(file) => setFile(file)}
              fileName={file?.name || ""}
            />
            {errors.file && (
              <span className="text-red-500 text-sm">{errors.file}</span>
            )}
          </div>

          <div className="flex flex-row justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
