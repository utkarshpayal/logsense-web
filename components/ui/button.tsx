import React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "icon" | "icon-sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer",
          // Variants
          variant === "default" && "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10",
          variant === "outline" && "border border-slate-800 bg-slate-900/40 text-slate-350 hover:bg-slate-800 hover:text-white",
          variant === "ghost" && "text-slate-400 hover:bg-slate-800 hover:text-white",
          variant === "link" && "text-cyan-400 underline-offset-4 hover:underline",
          // Sizes
          size === "default" && "px-4 py-2.5",
          size === "sm" && "px-3 py-1.5 text-[11px]",
          size === "icon" && "h-9 w-9 p-0",
          size === "icon-sm" && "h-7.5 w-7.5 p-0",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
