'use strict';
// components/MentalStateIndicator.tsx
import React from "react";
import { cn } from "@/lib/helpers";

const emotionIcons = {
  stressed: "😰",
  relaxed: "😌",
  happy: "😄",
  focused: "🧠",
  neutral: "😐",
  mild_stress: "😟",
  no_data: "⏳"
};

const emotionStyles = {
  stressed: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50",
  relaxed: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50",
  happy: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50",
  focused: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50",
  neutral: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/50",
  mild_stress: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/50",
  no_data: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 animate-gentle-pulse"
};

export type EmotionalState = keyof typeof emotionIcons;

interface MoodDisplayProps {
  state: EmotionalState;
}

export function MoodDisplay({ state }: MoodDisplayProps) {
  const formattedLabel = state === "no_data" ? "Analyzing..." : state.replace("_", " ");
  
  return (
    <div className={cn(
      "px-4 py-2.5 rounded-xl flex items-center space-x-3 border font-medium transition-all duration-200 backdrop-blur-sm",
      emotionStyles[state]
    )}>
      <span className="text-lg">{emotionIcons[state]}</span>
      <span className="font-semibold capitalize text-sm tracking-tight">
        {formattedLabel}
      </span>
    </div>
  );
}

