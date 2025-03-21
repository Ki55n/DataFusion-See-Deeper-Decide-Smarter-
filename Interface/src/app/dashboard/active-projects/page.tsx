"use client";

import { useEffect, useState } from "react";

import { UserAuth } from "@/app/context/AuthContext";
import { getProjectsByUserId } from "@/services/projectService";
import { mapToProjectFormat } from "@/utils/projectUtils";
import Dashboard from "@/components/active-projects/Dashboard";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading";
import { ProjectDTO } from "@/types";
// Assuming you have a Project type defined

// Type expected by the Dashboard component
type Project = {
  _id: string;
  name: string;
  description: string;
  createdAt: Date;
  status: string;
  files: any[];
  userId: string;
};

export default function DashboardPage() {
  const { user, dbUser, loading: authLoading }: any = UserAuth(); // Add dbUser from context
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login"); // Redirect to the login page if not authenticated
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProjects() {
      if (user && dbUser && dbUser.id) { // Check for dbUser.id
        try {
          const fetchedProjects = await getProjectsByUserId(dbUser.id); // Use dbUser.id instead of user.uid
          console.log("DB User ID:", dbUser.id); // Log the DB user ID
          console.log("Fetched projects:", fetchedProjects);
          
          // Map ProjectDTO to Project type expected by Dashboard using helper function
          const mappedProjects = fetchedProjects.map(mapToProjectFormat).filter(Boolean) as Project[];
          console.log("Mapped projects:", mappedProjects);
          
          setProjects(mappedProjects);
        } catch (error) {
          console.error("Error fetching projects:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!authLoading) {
        // If authentication is complete but no dbUser, set loading to false
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [user, dbUser, authLoading]);

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return <Dashboard initialProjects={projects} />;
}
