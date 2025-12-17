import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Loader2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import { format } from "date-fns";

interface ChatInterfaceProps {
  projectId: string | null;
  onMessageSent?: () => void;
}

export function ChatInterface({ projectId, onMessageSent }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/projects", projectId, "messages"],
    enabled: !!projectId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/messages`, {
        content,
        role: "user",
      });
      return response;
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      onMessageSent?.();
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !sendMessage.isPending) {
      sendMessage.mutate(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
                  </div>
                </div>
              </div>
            ))
          )}
          {sendMessage.isPending && (
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
                    <span>Analyzing your input...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste client email or meeting notes here..."
              className="min-h-24 max-h-48 resize-none pr-12"
              disabled={sendMessage.isPending}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-2 right-2"
              disabled={!input.trim() || sendMessage.isPending}
              data-testid="button-send-message"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
