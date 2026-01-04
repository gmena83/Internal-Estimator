import { Check, X, Star, Clock, DollarSign, Code2, Blocks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Scenario, ROIAnalysis } from "@shared/schema";

interface ScenarioComparisonProps {
  scenarioA: Scenario | null;
  scenarioB: Scenario | null;
  roiAnalysis: ROIAnalysis | null;
  selectedScenario: string | null;
  onSelectScenario?: (scenario: "A" | "B") => void;
}

export function ScenarioComparison({
  scenarioA,
  scenarioB,
  roiAnalysis,
  selectedScenario,
  onSelectScenario,
}: ScenarioComparisonProps) {
  if (!scenarioA && !scenarioB) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarioA && (
          <ScenarioCard
            scenario={scenarioA}
            variant="A"
            icon={Code2}
            selected={selectedScenario === "A"}
            onSelect={() => onSelectScenario?.("A")}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
        {scenarioB && (
          <ScenarioCard
            scenario={scenarioB}
            variant="B"
            icon={Blocks}
            selected={selectedScenario === "B"}
            onSelect={() => onSelectScenario?.("B")}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
      </div>

      {roiAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-chart-4" />
            ROI Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Cost of Doing Nothing</p>
              <p className="text-xl font-semibold text-destructive">
                {formatCurrency(roiAnalysis.costOfDoingNothing)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per year</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Manual Operational Cost</p>
              <p className="text-xl font-semibold">
                {formatCurrency(roiAnalysis.manualOperationalCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per year</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Projected Savings</p>
              <p className="text-xl font-semibold text-chart-4">
                {formatCurrency(roiAnalysis.projectedSavings)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per year</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
              <p className="text-xl font-semibold">{roiAnalysis.paybackPeriodMonths} months</p>
              <p className="text-xs text-muted-foreground mt-1">
                3-Year ROI: {formatNumber(roiAnalysis.threeYearROI)}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface ScenarioCardProps {
  scenario: Scenario;
  variant: "A" | "B";
  icon: React.ElementType;
  selected: boolean;
  onSelect?: () => void;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}

function ScenarioCard({
  scenario,
  variant,
  icon: Icon,
  selected,
  onSelect,
  formatCurrency,
  formatNumber,
}: ScenarioCardProps) {
  return (
    <Card
      className={`p-6 relative ${
        selected ? "ring-2 ring-primary" : ""
      } ${scenario.recommended ? "border-chart-4" : ""}`}
      data-testid={`scenario-card-${variant}`}
    >
      {scenario.recommended && (
        <Badge className="absolute -top-2 right-4 bg-chart-4 text-white">
          <Star className="h-3 w-3 mr-1" />
          Recommended
        </Badge>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            Scenario {variant}: {scenario.name}
          </h3>
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-xl font-semibold">{formatCurrency(scenario.totalCost)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Timeline</p>
            <p className="text-xl font-semibold flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {scenario.timeline}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {formatNumber(scenario.totalHours)} hours @ {formatCurrency(scenario.hourlyRate)}/hr
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Features</p>
          <ul className="space-y-1">
            {scenario.features.slice(0, 4).map((feature, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <Check className="h-4 w-4 text-chart-4 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
            {scenario.features.length > 4 && (
              <li className="text-sm text-muted-foreground">
                +{scenario.features.length - 4} more features
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Tech Stack</p>
          <div className="flex flex-wrap gap-1">
            {scenario.techStack.map((tech, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-chart-4 mb-1">Pros</p>
            <ul className="space-y-1">
              {scenario.pros.slice(0, 2).map((pro, i) => (
                <li key={i} className="text-xs flex items-start gap-1">
                  <Check className="h-3 w-3 text-chart-4 flex-shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-destructive mb-1">Cons</p>
            <ul className="space-y-1">
              {scenario.cons.slice(0, 2).map((con, i) => (
                <li key={i} className="text-xs flex items-start gap-1">
                  <X className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {onSelect && (
          <Button
            className="w-full mt-4"
            variant={selected ? "default" : "outline"}
            onClick={onSelect}
            data-testid={`button-select-scenario-${variant}`}
          >
            {selected ? "Selected" : `Select Scenario ${variant}`}
          </Button>
        )}
      </div>
    </Card>
  );
}
