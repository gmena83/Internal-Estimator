import React from "react";
import { Paperclip, Image, FileIcon, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@shared/schema";

interface DocumentsViewProps {
  attachments: Attachment[];
}

export function DocumentsView({ attachments }: DocumentsViewProps) {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-8 w-8" />;
    }
    return <FileIcon className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Paperclip className="h-5 w-5" />
        Project Documents ({attachments.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="p-4" data-testid={`doc-${attachment.id}`}>
            <div className="flex items-start gap-3">
              <div className="text-muted-foreground">{getFileIcon(attachment.mimeType)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" title={attachment.originalName}>
                  {attachment.originalName}
                </p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={attachment.url}
                  download={attachment.originalName}
                  title={`Download ${attachment.originalName}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
