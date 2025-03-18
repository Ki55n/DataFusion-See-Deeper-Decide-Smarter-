"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  PlusCircle,
  Trash2,
  Edit,
  MoreVertical,
  ArrowUpRightFromCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { createProject, getProjectsByUserId, changeProjectStatus, deleteProject } from "@/services/projectService";
import { UserAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ProjectDTO } from "@/types";
import { motion } from "framer-motion";

const ShimmerCard = () => (
  <div className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden relative transform transition-all duration-300">
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-7 bg-gray-700/50 rounded-md w-2/3"></div>
        <div className="h-8 w-8 bg-gray-700/50 rounded-md"></div>
      </div>
      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
        <div className="h-4 bg-gray-700/50 rounded w-4/5"></div>
      </div>
      {/* Date and Status */}
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-gray-700/50 mr-2"></div>
          <div className="h-4 bg-gray-700/50 rounded w-1/3"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-4 bg-gray-700/50 rounded-full"></div>
          <div className="h-4 bg-gray-700/50 rounded w-16"></div>
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-8 w-20 bg-gray-700/50 rounded-md"></div>
        <div className="h-8 w-20 bg-gray-700/50 rounded-md"></div>
      </div>
    </div>
    {/* Shimmer Effect */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
  </div>
);

export default function Component() {
  const { user, dbUser, loading: authLoading }: any = UserAuth();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login"); // Redirect to the login page if not authenticated
    }
  }, [user, authLoading, router]);

  const fetchProjects = async () => {
    if (dbUser && dbUser.id) {
      setIsLoading(true);
      try {
        const fetchedProjects = await getProjectsByUserId(dbUser.id);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  useEffect(() => {
    if (dbUser) {
      fetchProjects();
    }
  }, [dbUser]); // Run this effect when the dbUser changes

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;
    
    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        userId: dbUser.id,
      };

      const createdProject = await createProject(projectData);

      if (createdProject) {
        setIsOpen(false);
        setNewProject({ name: "", description: "" });
        fetchProjects(); // Refresh the projects list
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const success = await deleteProject(id);
      if (success) {
        setProjects(projects.filter((project) => project.id !== id));
        setIsDeleteDialogOpen(false);
        setProjectToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleEditProject = (id: string) => {
    console.log(`Editing project with id: ${id}`);
    // Implement edit functionality
  };

  const handleToggleActive = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const updatedProject = await changeProjectStatus(id, newStatus);
      
      if (updatedProject) {
        setProjects(
          projects.map((project) =>
            project.id === id
              ? { ...project, status: newStatus }
              : project
          )
        );
      }
    } catch (error) {
      console.error("Error toggling project status:", error);
    }
  };

  const confirmDelete = (id: string) => {
    setProjectToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-8">
        <header className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6"
          >
            All Projects
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4"
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-gradient-to-r from-blue-500 to-purple-700 hover:from-blue-600 hover:to-purple-800 transition-all duration-300 text-white border-0 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                  disabled
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Project
                </Button>
              </DialogTrigger>
            </Dialog>
          </motion.div>
        </header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[...Array(6)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ShimmerCard />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-8">
      <header className="mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6"
        >
          All Projects
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4"
        >
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-gradient-to-r from-blue-500 to-purple-700 hover:from-blue-600 hover:to-purple-800 transition-all duration-300 text-white border-0 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 border border-gray-700 shadow-xl transform transition-all duration-300">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                  Create New Project
                </DialogTitle>
                <DialogDescription className="text-gray-400 mt-2">
                  Enter the details for your new project. Make it something amazing!
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="mt-6">
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Project Name
                    </Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      className="bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      placeholder="Enter project name..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      className="min-h-[120px] bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                      placeholder="Describe your project..."
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    disabled={!newProject.name || !newProject.description}
                  >
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </header>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`w-full bg-gray-800/80 backdrop-blur-sm border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                project.status === "active"
                  ? "border-green-500/50 hover:border-green-400"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-100 group">
                  <span className="truncate text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {project.name}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-100 transition-colors duration-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-gray-800 border-gray-700"
                    >
                      <DropdownMenuItem
                        onClick={() => handleEditProject(project.id)}
                        className="hover:bg-gray-700 text-gray-200 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => confirmDelete(project.id)}
                        className="hover:bg-gray-700 text-gray-200 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                  Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`project-active-${project.id}`}
                    checked={project.status === "active"}
                    onCheckedChange={() => handleToggleActive(project.id, project.status)}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
                  />
                  <label
                    htmlFor={`project-active-${project.id}`}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                      project.status === "active" ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {project.status === "active" ? "Active" : "Inactive"}
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link
                  href={{
                    pathname: `/project/${project.id}`,
                    query: { name: project.name },
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-300 hover:text-white border-gray-600 hover:border-blue-500 bg-gray-800/50 hover:bg-blue-600/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <ArrowUpRightFromCircle className="mr-2 h-4 w-4" />
                    Visit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmDelete(project.id)}
                  className="text-gray-300 hover:text-red-400 border-gray-600 hover:border-red-500 bg-gray-800/50 hover:bg-red-600/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setProjectToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 border border-gray-700 shadow-xl transform transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-400">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex space-x-2">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
