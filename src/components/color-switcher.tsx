"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Color } from "@/components/theme-provider";

const colors: { id: Color; name: string; colorClass: string }[] = [
  { id: "default", name: "Default", colorClass: "bg-[#0ea5e9]" },
  { id: "purple", name: "Purple", colorClass: "bg-[#a855f7]" },
  { id: "blue", name: "Blue", colorClass: "bg-[#3b82f6]" },
  { id: "olive", name: "Olive", colorClass: "bg-[#b4c087]" },
  { id: "tangerine", name: "Tangerine", colorClass: "bg-[#f97316]" },
];

export function ColorSwitcher() {
  const { color, setColor } = useTheme();

  return (
    <>
      {/* Desktop: Pills */}
      <div className="hidden md:flex items-center space-x-1 rounded-lg border p-1">
        {colors.map((colorOption) => (
          <Button
            key={colorOption.id}
            variant={color === colorOption.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setColor(colorOption.id)}
            className="h-8 px-3 text-xs font-medium"
          >
            <div
              className={`mr-2 h-3 w-3 rounded-full border border-border/50 ${colorOption.colorClass}`}
            />
            {colorOption.name}
          </Button>
        ))}
      </div>

      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Palette className="h-4 w-4" />
              <span className="sr-only">Select color palette</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {colors.map((colorOption) => (
              <DropdownMenuItem
                key={colorOption.id}
                onClick={() => setColor(colorOption.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-4 w-4 rounded-full border border-border/50 ${colorOption.colorClass}`}
                  />
                  <span>{colorOption.name}</span>
                </div>
                {color === colorOption.id && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}