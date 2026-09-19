import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "border-transparent bg-orange-600 text-white",
        variant === "secondary" && "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        variant === "destructive" && "border-transparent bg-red-600 text-white",
        variant === "outline" && "text-slate-950 dark:text-slate-50",
        variant === "success" && "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        variant === "warning" && "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        className
      )}
      {...props}
    />
  );
}
