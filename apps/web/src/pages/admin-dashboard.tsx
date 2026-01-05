import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  Brain,
} from "lucide-react";

import ProjectsTab from "@/components/features/admin/projects-tab";
import UsersTab from "@/components/features/admin/users-tab";
import SystemTab from "@/components/features/admin/system-tab";
import { LearningsTab } from "@/components/features/admin/learnings-tab";

const FilesTab = () => <div>File Management (Pending)</div>;
const PricingTab = () => <div>Pricing Matrix (Pending)</div>;

export const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Simple check on mount (ideally use a real auth hook)
  useEffect(() => {
    fetch("/api/user")
      .then((res) => {
        if (res.status === 401) {
          setIsAdmin(false);
          return null;
        }
        return res.json();
      })
      .then((user) => {
        if (user && user.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) {
    return <div className="p-8">Checking permissions...</div>;
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have administrative privileges to view this dashboard.
          </AlertDescription>
        </Alert>
        <div className="text-sm text-muted-foreground">
          Please contact your system administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage projects, system status, and configurations.
            </p>
          </div>
          {/* Access to public pages */}
          {/* <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" /> Live Site
                    </Button> */}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects" className="items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Projects
            </TabsTrigger>
            <TabsTrigger value="files" className="items-center gap-2">
              <FileText className="w-4 h-4" /> Files
            </TabsTrigger>
            <TabsTrigger value="learnings" className="items-center gap-2">
              <Brain className="w-4 h-4" /> Learning
            </TabsTrigger>
            <TabsTrigger value="pricing" className="items-center gap-2">
              <Activity className="w-4 h-4" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="system" className="items-center gap-2">
              <Settings className="w-4 h-4" /> System
            </TabsTrigger>
            <TabsTrigger value="users" className="items-center gap-2">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <FilesTab />
          </TabsContent>

          <TabsContent value="learnings" className="space-y-4">
            <LearningsTab />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <PricingTab />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <SystemTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
