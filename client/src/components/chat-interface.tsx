import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Loader2, User, Bot, Paperclip, X, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, Attachment } from "@shared/schema";
import { format } from "date-fns";

interface ChatInterfaceProps {
  projectId: string | null;
  onMessageSent?: () => void;
}

interface PendingFile {
  file: File;
  preview?: string;
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/markdown",
  "text/plain",
  "text/x-markdown",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function ChatInterface({ projectId, onMessageSent }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/projects", projectId, "messages"],
    enabled: !!projectId,
  });

  const uploadFiles = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      
      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload files");
      }
      
      return response.json() as Promise<{ attachments: Attachment[] }>;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, attachments }: { content: string; attachments?: Attachment[] }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/messages`, {
        content,
        role: "user",
        attachments,
      });
      return response;
    },
    onSuccess: () => {
      setInput("");
      setPendingFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      onMessageSent?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles: PendingFile[] = [];
    
    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload images, PDFs, or markdown files.`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        return;
      }
      
      const pendingFile: PendingFile = { file };
      
      if (file.type.startsWith("image/")) {
        pendingFile.preview = URL.createObjectURL(file);
      }
      
      validFiles.push(pendingFile);
    });
    
    setPendingFiles((prev) => [...prev, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && pendingFiles.length === 0) || sendMessage.isPending || uploadFiles.isPending) {
      return;
    }
    
    let attachments: Attachment[] | undefined;
    
    if (pendingFiles.length > 0) {
      try {
        const result = await uploadFiles.mutateAsync(pendingFiles.map((pf) => pf.file));
        attachments = result.attachments;
      } catch {
        return;
      }
    }
    
    sendMessage.mutate({
      content: input.trim() || (attachments ? "Attached reference documents" : ""),
      attachments,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isPending = sendMessage.isPending || uploadFiles.isPending;

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">Welcome to ISI</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Select a project from the sidebar or create a new one to start generating
          estimates, proposals, and execution guides.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </div>
            ))
          ) : messages?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                Paste your client email or meeting notes below to get started.
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                You can also attach screenshots, PDFs, or markdown files as references.
              </p>
            </div>
          ) : (
            messages?.map((message) => (
              <div
                key={message.id}
                className="flex gap-3"
                data-testid={`message-${message.id}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback
                    className={
                      message.role === "user"
                        ? "bg-secondary"
                        : "bg-primary text-primary-foreground"
                    }
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {message.role === "user" ? "You" : "ISI"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.createdAt
                        ? format(new Date(message.createdAt), "h:mm a")
                        : ""}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-muted"
                        : "bg-card border border-card-border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.attachments.map((attachment: Attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-background/50 border border-border text-sm hover-elevate"
                            data-testid={`attachment-${attachment.id}`}
                          >
                            {getFileIcon(attachment.mimeType)}
                            <span className="truncate max-w-[120px]">{attachment.originalName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(attachment.size)}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isPending && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">ISI</span>
                </div>
                <div className="bg-card border border-card-border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {uploadFiles.isPending ? "Uploading files..." : "Analyzing your input..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {pendingFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 animate-fade-slide-in">
              {pendingFiles.map((pf, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border"
                >
                  {pf.preview ? (
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="h-8 w-8 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(pf.file.type)
                  )}
                  <span className="text-sm truncate max-w-[120px]">{pf.file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(pf.file.size)}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removePendingFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste client email or meeting notes here..."
              className="min-h-24 max-h-48 resize-none pr-24"
              disabled={isPending}
              data-testid="input-chat-message"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                type="button"
                variant="glass"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                data-testid="button-attach-file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                variant="glass-primary"
                size="icon"
                disabled={(!input.trim() && pendingFiles.length === 0) || isPending}
                data-testid="button-send-message"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line. Attach PDFs, images, or markdown files.
          </p>
        </form>
      </div>
    </div>
  );
}
