"use server";

import prisma from "@/lib/prisma";
import { CreateUserDTO, UserDTO } from "@/types";

export async function getUserById(userId: string): Promise<UserDTO | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserDTO | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function createUser(userData: CreateUserDTO): Promise<UserDTO | null> {
  try {
    const user = await prisma.user.create({
      data: userData,
    });
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function updateUser(userId: string, userData: Partial<CreateUserDTO>): Promise<UserDTO | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: userData,
    });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
} 