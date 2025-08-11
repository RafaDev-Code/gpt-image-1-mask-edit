"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function SchemeToggle() {
  const { scheme, setScheme } = useTheme();

  const toggleScheme = () => {
    setScheme(scheme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleScheme}
      className="h-8 w-8 min-w-[32px]"
      aria-current={scheme === 'light' ? 'true' : undefined}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform motion-reduce:transition-none dark:[-rotate-90] dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform motion-reduce:transition-none dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        {scheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      </span>
    </Button>
  );
}