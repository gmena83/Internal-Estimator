import React, { useState } from 'react';
import { Project } from '../types';
import { cn } from '../lib/utils';
import { Plus, Search, Clock, Upload, Sun, Moon, TrendingUp, Database, Settings } from 'lucide-react';
import { Input, Button, Badge, Card, Sparkline } from './ui/UIComponents';
import { Link } from 'wouter';

interface LeftSidebarProps {
    projects: Project[];
    activeProjectId?: string;
    onCreateProject: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ projects, activeProjectId, onCreateProject, isDark, onToggleTheme }) => {
    const [search, setSearch] = useState('');
    const [lang, setLang] = useState<'en' | 'es'>('en');

    // Handle undefined projects gracefully
    const filteredProjects = (projects || []).filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.client.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-64 h-full border-r border-border bg-background flex flex-col transition-colors duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold text-xs">I</div>
                        <span className="font-semibold text-primary/90 tracking-tight">ISI Agent</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCreateProject}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-8 bg-card border-transparent focus:bg-accent/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Quick Actions</div>
                <Button variant="secondary" className="w-full justify-start text-xs mb-1 h-8" onClick={onCreateProject}>
                    <Plus className="w-3 h-3 mr-2" /> New Project
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs h-8 text-muted-foreground">
                    <Upload className="w-3 h-3 mr-2" /> Upload Context
                </Button>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto px-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-2">Projects</div>
                <div className="space-y-0.5">
                    {filteredProjects.map(project => (
                        <Link key={project.id} href={`/project/${project.id}`}>
                            <a className={cn(
                                "flex flex-col gap-1 p-2 rounded-md transition-all duration-200 group border border-transparent cursor-pointer no-underline",
                                activeProjectId === project.id
                                    ? "bg-muted border-border shadow-sm"
                                    : "hover:bg-muted/50 hover:border-border/50"
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className={cn("text-sm font-medium", activeProjectId === project.id ? "text-primary" : "text-muted-foreground")}>
                                        {project.name}
                                    </span>
                                    {project.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{project.client}</span>
                                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </a>
                        </Link>
                    ))}
                </div>

                {/* Response Time Chart */}
                <div className="mt-6 px-2 mb-4">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Response Trend (1h)
                    </div>
                    <Card className="p-3 bg-muted/50 border-border">
                        <div className="flex items-end justify-between mb-2">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-foreground leading-none">145<span className="text-sm font-normal text-muted-foreground ml-0.5">ms</span></span>
                            </div>
                            <Badge variant="success" className="mb-0.5 text-[10px] px-1.5 py-0">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                -12%
                            </Badge>
                        </div>
                        <Sparkline seed="response-time-sidebar" className="w-full h-8 text-primary" />
                    </Card>
                </div>

                {/* Knowledge Base Widget */}
                <div className="px-2 mb-4">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Knowledge Base
                    </div>
                    <Card className="p-3 bg-muted/50 border-border relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-all border-dashed">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold">Corporate Context</span>
                                <span className="text-[10px] text-muted-foreground">1,240 documents indexed</span>
                            </div>
                            <div className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                <Settings className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                            </div>
                        </div>

                        {/* Visual Storage Breakdown */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Index Usage</span>
                                <span className="font-mono font-medium">82%</span>
                            </div>
                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-background ring-1 ring-border/50">
                                <div className="w-[35%] bg-blue-500 hover:opacity-80 transition-opacity" title="PDFs" />
                                <div className="w-[25%] bg-purple-500 hover:opacity-80 transition-opacity" title="Docs" />
                                <div className="w-[22%] bg-emerald-500 hover:opacity-80 transition-opacity" title="Spreadsheets" />
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-1">
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-500" /> PDF</span>
                                    <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-purple-500" /> DOC</span>
                                </div>
                                <span className="text-primary hover:underline">Manage Files</span>
                            </div>
                        </div>
                    </Card>
                </div>

            </div>

            {/* Footer / User Profile & Settings */}
            <div className="p-4 border-t border-border">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 ring-2 ring-background shadow-lg" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium">Admin User</span>
                        <span className="text-[10px] text-muted-foreground">Pro Plan</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-muted/50 border border-border backdrop-blur-sm">
                    {/* Language Switch */}
                    <div className="flex items-center bg-background rounded border border-border/50 p-0.5 shadow-inner">
                        <button
                            onClick={() => setLang('en')}
                            className={cn(
                                "px-2.5 py-1 text-[10px] font-bold rounded transition-all duration-200",
                                lang === 'en' ? "bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLang('es')}
                            className={cn(
                                "px-2.5 py-1 text-[10px] font-bold rounded transition-all duration-200",
                                lang === 'es' ? "bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            ES
                        </button>
                    </div>

                    <div className="w-px h-4 bg-border mx-1" />

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 rounded-md p-0 text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border"
                        onClick={onToggleTheme}
                    >
                        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
