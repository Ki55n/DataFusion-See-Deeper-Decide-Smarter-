import { ProjectDTO } from "@/types";

// Helper function to map ProjectDTO to the format expected by Dashboard component
export function mapToProjectFormat(project: ProjectDTO) {
  if (!project) return null;
  
  return {
    _id: project.id,
    name: project.name || '',
    description: project.description || '',
    createdAt: project.createdAt || new Date(),
    status: project.status || 'inactive',
    files: project.files || [],
    userId: project.userId || '',
  };
} 