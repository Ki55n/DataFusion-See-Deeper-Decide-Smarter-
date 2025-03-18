"use server";

import prisma from "@/lib/prisma";
import { CreateFileDTO, FileDTO } from "@/types";

export async function getFilesByProjectId(projectId: string): Promise<FileDTO[]> {
  try {
    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: { dateUploaded: 'desc' },
    });
    
    return files;
  } catch (error) {
    console.error("Error fetching files:", error);
    return [];
  }
}

export async function getFileById(fileId: string): Promise<FileDTO | null> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });
    return file;
  } catch (error) {
    console.error("Error fetching file:", error);
    return null;
  }
}

export async function getFileByUuid(fileUuid: string): Promise<FileDTO | null> {
  try {
    const file = await prisma.file.findUnique({
      where: { file_uuid: fileUuid },
    });
    return file;
  } catch (error) {
    console.error("Error fetching file by UUID:", error);
    return null;
  }
}

export async function uploadFile(
  userId: string,
  projectId: string,
  description: string | undefined,
  file: {
    name: string;
    size: number;
    file_uuid: string;
    file_path?: string;
    table_name?: string;
  }
): Promise<FileDTO | null> {
  const fileData: CreateFileDTO = {
    name: file.name,
    size: file.size,
    description: description,
    file_uuid: file.file_uuid,
    projectId: projectId,
    file_path: file.file_path,
    table_name: file.table_name,
  };
  
  try {
    const createdFile = await prisma.file.create({
      data: fileData,
    });
    
    // Update the project's updatedAt timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: {
        updatedAt: new Date(),
      },
    });
    
    return createdFile;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { projectId: true },
    });
    
    if (!file) return false;
    
    await prisma.file.delete({
      where: { id: fileId },
    });
    
    // Update the project's updatedAt timestamp
    await prisma.project.update({
      where: { id: file.projectId },
      data: {
        updatedAt: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
} 