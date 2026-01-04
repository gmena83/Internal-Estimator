import React from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";
import { StageStatus, Stage } from "@/types";

interface StageProgressProps {
  stages?: Stage[];
  currentStage?: number;
  completedStages?: number[];
}

export const StageProgress: React.FC<StageProgressProps> = ({
  stages: propsStages,
  currentStage,
  completedStages,
}) => {
  // Generate stages if not provided as a prop
  const stages: Stage[] =
    propsStages ||
    [
      { id: "1", label: "Discovery", status: StageStatus.TODO },
      { id: "2", label: "Drafting", status: StageStatus.TODO },
      { id: "3", label: "Proposal", status: StageStatus.TODO },
      { id: "4", label: "Manuals", status: StageStatus.TODO },
      { id: "5", label: "Launch", status: StageStatus.TODO },
    ].map((s) => {
      const stageId = parseInt(s.id);
      if (completedStages?.includes(stageId)) return { ...s, status: StageStatus.DONE };
      if (currentStage === stageId) return { ...s, status: StageStatus.RUNNING };
      return s;
    });
  return (
    <div className="w-full pt-4 pb-16 px-16">
      <div className="flex items-center w-full justify-between">
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
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 z-10",
                    circleBg,
                    borderColor,
                    glow,
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      iconColor,
                      stage.status === StageStatus.RUNNING && "animate-spin",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "absolute top-10 text-[11px] font-medium text-center w-24 left-1/2 -translate-x-1/2 transition-colors line-clamp-2 leading-tight",
                    textColor,
                  )}
                >
                  {stage.label}
                </span>
              </div>

              {!isLast && (
                <div className="flex-1 h-[1px] mx-4 bg-muted relative overflow-hidden">
                  {stage.status === StageStatus.DONE && (
                    <div className="absolute inset-0 bg-primary w-full" />
                  )}
                  {stage.status === StageStatus.RUNNING && (
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
