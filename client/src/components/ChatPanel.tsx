import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { cn } from '../lib/utils';
import { Send, Bot, User, Paperclip } from 'lucide-react';

interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    isStreaming: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isStreaming }) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isStreaming]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    // Skip system messages for now if needed, or style them differently
                    if (msg.role === 'system') {
                        return (
                            <div key={msg.id} className="flex justify-center my-4">
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{msg.content}</span>
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={cn("flex gap-4 max-w-3xl mx-auto w-full", isUser ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border",
                                isUser ? "bg-muted border-muted-foreground/20" : "bg-primary/10 border-primary/20"
                            )}>
                                {isUser ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
                            </div>

                            <div className={cn(
                                "flex flex-col gap-1 min-w-0 max-w-[80%]",
                                isUser ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                    isUser ? "bg-secondary text-secondary-foreground rounded-tr-sm" : "bg-card border border-border text-card-foreground rounded-tl-sm"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground opacity-50 px-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {isStreaming && (
                    <div className="flex gap-4 max-w-3xl mx-auto w-full">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 h-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm z-10 w-full">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative w-full">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={() => { }}
                    />
                    <label
                        htmlFor="file-upload"
                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                        <Paperclip className="w-5 h-5" />
                    </label>

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe the mission or paste client brief..."
                        className="w-full bg-card border border-input rounded-lg pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        title="Send message"
                        className="absolute right-2 top-2 p-1.5 rounded-md bg-muted text-muted-foreground hover:text-primary hover:bg-muted/80 disabled:opacity-50 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-muted-foreground">Press Enter to send • Gemini & Claude active</span>
                </div>
            </div>
        </div>
    );
};
