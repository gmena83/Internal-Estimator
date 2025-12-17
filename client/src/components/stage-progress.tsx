import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES } from "@shared/schema";

interface StageProgressProps {
  currentStage: number;
  completedStages?: number[];
}

export function StageProgress({ currentStage, completedStages = [] }: StageProgressProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-10" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-300"
          style={{ width: `${((currentStage - 1) / (STAGES.length - 1)) * 100}%` }}
        />
        
        {STAGES.map((stage) => {
          const isCompleted = completedStages.includes(stage.number) || stage.number < currentStage;
          const isCurrent = stage.number === currentStage;
          const isFuture = stage.number > currentStage;

          return (
            <div
              key={stage.number}
              className="flex flex-col items-center"
              data-testid={`stage-indicator-${stage.number}`}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-background border-primary text-primary ring-4 ring-primary/20",
                  isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stage.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center max-w-[80px] leading-tight",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
