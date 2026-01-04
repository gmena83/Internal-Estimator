import React from "react";
import { LayoutDashboard } from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-background">
      <div className="p-4 rounded-full bg-card border border-border">
        <LayoutDashboard className="w-12 h-12 text-muted-foreground/20" />
      </div>
      <p>Select a project to view details</p>
    </div>
  );
};
