"use server";

import { uploadFile as uploadFileToPrisma, getFilesByProjectId } from "@/services/fileService";
import { FileDTO } from "@/types";

/**
 * @deprecated Use getFilesByProjectId from services/fileService instead
 */
export async function getFilesByUserIdProjectId(userId: string, projectId: string): Promise<FileDTO[]> {
  return getFilesByProjectId(projectId);
}

/**
 * @deprecated Use uploadFile from services/fileService instead
 */
export async function uploadFileToDb(
  userId: string,
  projectId: string,
  description: string | undefined,
  file: {
    name: string;
    size: number;
    file_uuid: string;
    dateUploaded: Date;
  }
): Promise<FileDTO | null> {
  return uploadFileToPrisma(
    userId,
    projectId,
    description,
    {
      name: file.name,
      size: file.size,
      file_uuid: file.file_uuid,
    }
  );
} 