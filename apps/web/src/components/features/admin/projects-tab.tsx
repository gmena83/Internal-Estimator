import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Badge } from "@/components/ui/UIComponents";
import { Trash2, Undo2 } from "lucide-react";

export default function ProjectsTab() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: api.getAdminProjects,
  });

  const restoreMutation = useMutation({
    mutationFn: api.restoreProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-projects"] }),
  });

  const wipeMutation = useMutation({
    mutationFn: api.wipeProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-projects"] }),
  });

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading projects...</div>;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map((project) => (
            <TableRow key={project.id} className={project.deletedAt ? "bg-muted/50" : ""}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{project.name}</span>
                  {project.deletedAt && (
                    <Badge variant="error" className="w-fit text-[10px] h-4 px-1 mt-1">
                      Deleted
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{project.client}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell>
                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell className="text-right flex items-center justify-end gap-2">
                {project.deletedAt ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreMutation.mutate(project.id)}
                      isLoading={restoreMutation.isPending}
                    >
                      <Undo2 className="w-4 h-4 mr-2" /> Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm("Are you sure? This is permanent."))
                          wipeMutation.mutate(project.id);
                      }}
                      isLoading={wipeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Wipe
                    </Button>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Active</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {projects?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                No projects found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
