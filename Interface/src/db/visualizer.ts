"use client";

import { 
  createVisualization as createVisualizationService,
  getVisualizationsByUserId,
  getVisualizationById,
  updateVisualizationLayout,
  deleteVisualization
} from "@/services/visualizationService";
import { CreateVisualizationDTO, VisualizationDTO } from "@/types";

// Export the Visualization type
export type Visualization = VisualizationDTO;

// Function to save a visualization
export const saveVisualization = async (visualization: CreateVisualizationDTO): Promise<boolean> => {
  try {
    const result = await createVisualizationService(visualization);
    return !!result;
  } catch (error) {
    console.error("Error saving visualization:", error);
    return false;
  }
};

// Function to get visualizations by user ID
export const getVisualizations = async (userId: string): Promise<VisualizationDTO[]> => {
  try {
    return await getVisualizationsByUserId(userId);
  } catch (error) {
    console.error("Error getting visualizations:", error);
    return [];
  }
};

// Function to get a visualization by ID
export const getVisualization = async (id: string): Promise<VisualizationDTO | null> => {
  try {
    return await getVisualizationById(id);
  } catch (error) {
    console.error("Error getting visualization:", error);
    return null;
  }
};

// Function to update visualization layouts
export const updateLayouts = async (
  updates: { id: string; layout: any }[]
): Promise<boolean> => {
  try {
    return await updateVisualizationLayout(updates);
  } catch (error) {
    console.error("Error updating visualization layouts:", error);
    return false;
  }
};

// Function to delete a visualization
export const deleteVisualizationById = async (id: string): Promise<boolean> => {
  try {
    return await deleteVisualization(id);
  } catch (error) {
    console.error("Error deleting visualization:", error);
    return false;
  }
}; 