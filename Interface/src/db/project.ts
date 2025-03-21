"use server";

import prisma from "@/lib/prisma";
import { getProjectsByUserId } from "@/services/projectService";

// Re-export the function to maintain backward compatibility
export { getProjectsByUserId };

/**
 * Changes the status of a project
 * @param projectId The ID of the project to change status (can be _id or id format)
 * @param status The new status for the project
 */
export async function changeProjectStatus(projectId: string, status: string): Promise<boolean> {
  try {
    // When called from Dashboard component, projectId might be in _id format
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