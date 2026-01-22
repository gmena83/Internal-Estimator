import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, FileBarChart, Book, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/UIComponents";

interface DocTabsProps {
  documents: {
    proposal: string;
    report: string;
    guide: string;
  };
}

export const DocTabs: React.FC<DocTabsProps> = ({ documents }) => {
  const [activeTab, setActiveTab] = useState<"proposal" | "report" | "guide">("proposal");

  const tabs = [
    { id: "proposal", label: "Proposal.pdf", icon: FileText },
    { id: "report", label: "Internal Report", icon: FileBarChart },
    { id: "guide", label: "Execution Guide", icon: Book },
  ];

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-border px-4 pt-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-t border-x border-transparent mb-[-1px]",
                  isActive
                    ? "bg-background border-border text-foreground border-b-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Button size="sm" variant="ghost">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="w-3.5 h-3.5 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-background">
        <div className="max-w-3xl mx-auto bg-card text-card-foreground p-8 rounded shadow-sm border border-border min-h-[600px] font-serif">
          {/* Mock Markdown Rendering - keeping it simple for scaffold */}
          {documents[activeTab] ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground break-words">
              {documents[activeTab]}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <span className="italic">No content generated for this section yet.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert("Regenerate triggered (Placeholder)")} // Ideally passed as prop
              >
                Regenerate Content
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
