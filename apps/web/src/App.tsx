import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "./components/layouts/main-layout";

// --- App Entry & Providers ---
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="isi-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MainLayout />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
