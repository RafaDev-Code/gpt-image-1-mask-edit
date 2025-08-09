"use client";

import * as React from "react";
import { SchemeToggle } from "@/components/scheme-toggle";
import { ColorSwitcher } from "@/components/color-switcher";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SchemeToggle />
      <ColorSwitcher />
    </div>
  );
}