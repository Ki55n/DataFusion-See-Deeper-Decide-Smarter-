"use server";

import prisma from "@/lib/prisma";
import { CreateProjectDTO, ProjectDTO, UpdateProjectDTO } from "@/types";

export async function getProjectsByUserId(userId: string): Promise<ProjectDTO[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getProjectById(projectId: string): Promise<ProjectDTO | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function createProject(projectData: CreateProjectDTO): Promise<ProjectDTO | null> {
  try {
    const project = await prisma.project.create({
      data: projectData,
    });
    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    return null;
  }
}

export async function updateProject(
  projectId: string, 
  projectData: UpdateProjectDTO
): Promise<ProjectDTO | null> {
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: projectData,
    });
    return project;
  } catch (error) {
    console.error("Error updating project:", error);
    return null;
  }
}

export async function changeProjectStatus(projectId: string, newStatus: string): Promise<ProjectDTO | null> {
  return updateProject(projectId, { status: newStatus });
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    return false;
  }
}

export async function getProjectDetails(userId: string, projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        userId: userId 
      },
      include: {
        files: true,
      },
    });
    
    if (project) {
      return {
        _id: project.id,
        name: project.name,
        files: project.files,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
} 