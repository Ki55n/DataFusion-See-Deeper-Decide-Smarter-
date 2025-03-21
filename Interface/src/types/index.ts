// User types
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  id: string;
  name: string;
  email: string;
}

// Project types
export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  files?: FileDTO[];
}

export interface CreateProjectDTO {
  name: string;
  description: string;
  userId: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  status?: string;
}

// File types
export interface FileDTO {
  id: string;
  name: string;
  size: number;
  description: string | null | undefined;
  dateUploaded: Date;
  file_uuid: string;
  projectId: string;
  file_path: string | null | undefined;
  table_name: string | null | undefined;
}

export interface CreateFileDTO {
  name: string;
  size: number;
  description?: string | null;
  file_uuid: string;
  projectId: string;
  file_path?: string | null;
  table_name?: string | null;
}

// Visualization types
export interface VisualizationDTO {
  id: string;
  visualizationType: string;
  description?: string | null;
  summary?: string | null;
  data: any;
  layout: any;
  fileId: string;
  fileName: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVisualizationDTO {
  visualizationType: string;
  description?: string | null;
  summary?: string | null;
  data: any;
  layout: any;
  fileId: string;
  fileName: string;
  userId: string;
}

export interface UpdateVisualizationLayoutDTO {
  id: string;
  layout: any;
} 