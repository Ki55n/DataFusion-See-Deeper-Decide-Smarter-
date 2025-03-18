"use server";

import prisma from "@/lib/prisma";

/**
 * Changes the status of a project
 * @param projectId The ID of the project to change status
 * @param status The new status for the project
 */
export async function changeProjectStatus(projectId: string, status: string): Promise<boolean> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: status,
        updatedAt: new Date()
      },
    });
    return true;
  } catch (error) {
    console.error("Error changing project status:", error);
    return false;
  }
} 