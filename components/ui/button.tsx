import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer",
          variant === "default" && "bg-orange-600 text-white hover:bg-orange-700 shadow-sm",
          variant === "destructive" && "bg-red-600 text-white hover:bg-red-700 shadow-sm",
          variant === "outline" && "border border-slate-200 bg-transparent hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800",
          variant === "secondary" && "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
          variant === "ghost" && "hover:bg-slate-100 dark:hover:bg-slate-800",
          variant === "link" && "text-orange-600 underline-offset-4 hover:underline",
          size === "default" && "h-11 px-4 py-2",
          size === "sm" && "h-9 rounded-lg px-3 text-xs",
          size === "lg" && "h-12 rounded-2xl px-6 text-base",
          size === "icon" && "h-10 w-10 p-0",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
