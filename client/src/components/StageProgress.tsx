import React from 'react';
import { cn } from '../lib/utils';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import { StageStatus, Stage } from '../types';

interface StageProgressProps {
    stages: Stage[];
}

export const StageProgress: React.FC<StageProgressProps> = ({ stages }) => {
    return (
        <div className="w-full py-4 overflow-x-auto">
            <div className="flex items-center min-w-[600px] justify-between px-2">
                {stages.map((stage, index) => {
                    const isLast = index === stages.length - 1;

                    let Icon = Circle;
                    let iconColor = "text-muted-foreground";
                    let circleBg = "bg-card";
                    let borderColor = "border-muted";
                    let textColor = "text-muted-foreground";
                    let glow = "";

                    if (stage.status === StageStatus.DONE) {
                        Icon = Check;
                        iconColor = "text-primary-foreground";
                        circleBg = "bg-primary";
                        borderColor = "border-primary";
                        textColor = "text-foreground";
                        glow = "shadow-[0_0_10px_rgba(26,213,230,0.4)]";
                    } else if (stage.status === StageStatus.RUNNING) {
                        Icon = Loader2;
                        iconColor = "text-primary";
                        borderColor = "border-primary";
                        textColor = "text-primary";
                        glow = "shadow-[0_0_15px_rgba(26,213,230,0.2)]";
                    } else if (stage.status === StageStatus.ERROR) {
                        Icon = AlertCircle;
                        iconColor = "text-destructive";
                        borderColor = "border-destructive";
                        textColor = "text-destructive";
                    }

                    return (
                        <React.Fragment key={stage.id}>
                            <div className="flex flex-col items-center relative group">
                                <div className={cn(
                                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 z-10",
                                    circleBg, borderColor, glow
                                )}>
                                    <Icon className={cn("w-4 h-4", iconColor, stage.status === StageStatus.RUNNING && "animate-spin")} />
                                </div>
                                <span className={cn("absolute top-10 text-xs font-medium whitespace-nowrap transition-colors", textColor)}>
                                    {stage.label}
                                </span>
                            </div>

                            {!isLast && (
                                <div className="flex-1 h-[1px] mx-4 bg-muted relative overflow-hidden">
                                    {(stage.status === StageStatus.DONE) && (
                                        <div className="absolute inset-0 bg-primary w-full" />
                                    )}
                                    {(stage.status === StageStatus.RUNNING) && (
                                        <div className="absolute inset-0 bg-primary/50 w-full animate-pulse-slow origin-left" />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
