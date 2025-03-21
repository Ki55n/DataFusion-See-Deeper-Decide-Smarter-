"use server";

// Define a simplified user type to avoid circular references
interface SimplifiedFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

import prisma from "@/lib/prisma";

/**
 * Synchronizes a Firebase user with our Prisma database
 * This ensures that when a user authenticates with Firebase,
 * we also have their record in our PostgreSQL database
 */
export async function syncUserWithDatabase(firebaseUser: SimplifiedFirebaseUser) {
  if (!firebaseUser.email) {
    console.error("Firebase user has no email");
    return null;
  }

  try {
    console.log(`Attempting to sync user with email: ${firebaseUser.email}`);
    
    // Check if user already exists in our database
    let user = await prisma.user.findUnique({
      where: { email: firebaseUser.email },
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log(`User not found in database, creating new user for: ${firebaseUser.email}`);
      user = await prisma.user.create({
        data: {
          id: firebaseUser.uid, // Use Firebase UID as the database ID
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
        },
      });
      console.log(`Created new user in database with ID: ${user.id}`);
    } else {
      console.log(`Found existing user in database with ID: ${user.id}`);
    }

    return user;
  } catch (error: any) {
    console.error("Error syncing user with database:", error.message || "Unknown error");
    return null;
  }
} 