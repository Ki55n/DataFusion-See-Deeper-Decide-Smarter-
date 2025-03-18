"use server";

import prisma from "@/lib/prisma";
import { CreateVisualizationDTO, UpdateVisualizationLayoutDTO, VisualizationDTO } from "@/types";

export async function getVisualizationsByUserId(userId: string): Promise<VisualizationDTO[]> {
  try {
    const visualizations = await prisma.visualization.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return visualizations;
  } catch (error) {
    console.error("Error fetching visualizations:", error);
    return [];
  }
}

export async function getVisualizationById(id: string): Promise<VisualizationDTO | null> {
  try {
    const visualization = await prisma.visualization.findUnique({
      where: { id },
    });
    return visualization;
  } catch (error) {
    console.error("Error fetching visualization:", error);
    return null;
  }
}

export async function createVisualization(
  visualizationData: CreateVisualizationDTO
): Promise<VisualizationDTO | null> {
  try {
    const visualization = await prisma.visualization.create({
      data: visualizationData,
    });
    return visualization;
  } catch (error) {
    console.error("Error creating visualization:", error);
    return null;
  }
}

export async function updateVisualizationLayout(
  updates: UpdateVisualizationLayoutDTO[]
): Promise<boolean> {
  try {
    const updatePromises = updates.map(update => 
      prisma.visualization.update({
        where: { id: update.id },
        data: { 
          layout: update.layout,
          updatedAt: new Date()
        },
      })
    );
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error("Error updating visualization layouts:", error);
    return false;
  }
}

export async function deleteVisualization(id: string): Promise<boolean> {
  try {
    await prisma.visualization.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting visualization:", error);
    return false;
  }
} 