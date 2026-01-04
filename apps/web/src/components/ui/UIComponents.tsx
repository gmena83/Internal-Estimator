import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "icon";
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(26,213,230,0.3)] border border-transparent",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent",
    danger:
      "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20",
    outline: "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 py-2 text-sm",
    icon: "h-9 w-9",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

// --- Input ---
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// --- Badge ---
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "default" | "outline" | "success" | "warning" | "error";
  className?: string;
}> = ({ children, variant = "default", className }) => {
  const styles = {
    default: "bg-primary/10 text-primary border-transparent hover:bg-primary/20",
    outline: "text-foreground border-border",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

// --- Card ---
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

// --- Skeleton ---
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;

// --- Sparkline ---
export const Sparkline = ({
  seed,
  className,
  color = "text-primary",
}: {
  seed: string;
  className?: string;
  color?: string;
}) => {
  const points = React.useMemo(() => {
    let val = 50;
    // Generate pseudorandom points based on seed string
    return Array.from({ length: 12 })
      .map((_, i) => {
        val += ((seed.charCodeAt(i % seed.length) * (i + 1)) % 50) - 25;
        val = Math.max(10, Math.min(90, val));
        const x = (i / 11) * 100;
        const y = 100 - val;
        return `${x},${y}`;
      })
      .join(" ");
  }, [seed]);

  return (
    <svg
      className={cn("w-12 h-5", className, color)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  );
};
