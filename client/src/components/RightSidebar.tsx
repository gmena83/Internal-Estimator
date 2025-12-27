import React from 'react';
import { ApiHealth, ProjectUsage } from '../types';
import { cn } from '../lib/utils';
import { Activity, Zap, Database, DollarSign, Cpu, ArrowUpRight } from 'lucide-react';
import { Card, Badge, Sparkline } from './ui/UIComponents';

interface RightSidebarProps {
    health: ApiHealth[];
    usage: ProjectUsage;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ health, usage }) => {
    return (
        <div className="w-72 h-full border-l border-border bg-background flex flex-col overflow-y-auto transition-colors duration-300">

            {/* System Status */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm tracking-wide">SYSTEM STATUS</span>
                </div>

                <div className="space-y-3">
                    {health.map((h) => (
                        <div key={h.provider} className="flex flex-col gap-2 p-3 rounded bg-card border border-border">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{h.provider}</span>
                                <Badge variant={h.status === 'healthy' ? 'success' : h.status === 'degraded' ? 'warning' : 'error'}>
                                    {h.status}
                                </Badge>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 mt-1">
                                {/* Latency Section */}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Latency</span>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-medium">{h.latency}ms</span>
                                        <Sparkline
                                            seed={h.provider + 'lat'}
                                            color={h.status === 'healthy' ? 'text-emerald-500' : 'text-yellow-500'}
                                        />
                                    </div>
                                </div>

                                {/* Error Rate Section */}
                                <div className="flex flex-col gap-0.5 border-l border-border pl-3">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Errors</span>
                                    <div className="flex items-center justify-between">
                                        <span className={cn("font-mono text-xs font-medium", h.errorRate > 0 ? "text-red-400" : "text-muted-foreground")}>
                                            {h.errorRate}%
                                        </span>
                                        <Sparkline
                                            seed={h.provider + 'err'}
                                            color={h.errorRate > 0 ? 'text-red-500' : 'text-muted/30'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status Bar Indicator */}
                            <div className="w-full bg-background h-1 rounded-full overflow-hidden opacity-50">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500",
                                        h.status === 'healthy' ? "bg-green-500" : h.status === 'degraded' ? "bg-yellow-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${Math.min(100, (h.latency / 1000) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Usage Stats */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm tracking-wide">PROJECT USAGE</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">Live</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Tokens KPI */}
                    <Card className="p-3 flex flex-col justify-between bg-card border-border relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="text-xs font-medium">Tokens</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight">{(usage.tokens / 1000).toFixed(1)}k</span>
                            <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                                <ArrowUpRight className="w-3 h-3" /> +12%
                            </span>
                        </div>
                    </Card>

                    {/* Cost KPI */}
                    <Card className="p-3 flex flex-col justify-between bg-card border-border relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <DollarSign className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-medium">Cost</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight">${usage.cost.toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground">Est. final: $12.00</span>
                        </div>
                    </Card>
                </div>

                {/* Storage Metric */}
                <div className="mt-4 p-3 rounded bg-card border border-border">
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                        <span className="flex items-center gap-2 text-muted-foreground"><Database className="w-3.5 h-3.5" /> Storage</span>
                        <span className="text-foreground">{usage.storage.toFixed(1)}MB <span className="text-muted-foreground">/ 1GB</span></span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_var(--primary-glow)]"
                            style={{ width: `${Math.min(100, (usage.storage / 1000) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Orchestration / Footer */}
            <div className="mt-auto p-4 border-t border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Active Orchestration</span>
                <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded border border-border bg-card hover:bg-muted transition-colors cursor-pointer">
                    <span>Thinking Model</span>
                    <span className="text-primary font-mono font-medium">Claude 3.5 Sonnet</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded border border-border bg-card mt-2 hover:bg-muted transition-colors cursor-pointer">
                    <span>Search Engine</span>
                    <span className="text-blue-400 font-mono font-medium">Perplexity</span>
                </div>
            </div>
        </div>
    );
};
