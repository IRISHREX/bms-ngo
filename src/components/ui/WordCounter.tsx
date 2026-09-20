import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface WordCounterProps {
  text: string;
  maxWords?: number;
  maxChars?: number;
  showChars?: boolean;
  className?: string;
}

export function WordCounter({
  text = "",
  maxWords,
  maxChars,
  showChars = false,
  className,
}: WordCounterProps) {
  const { wordCount, charCount, isWordExceeded, isCharExceeded, isWordWarning, isCharWarning } = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;

    const wordExceeded = maxWords ? words > maxWords : false;
    const charExceeded = maxChars ? chars > maxChars : false;
    const wordWarning = maxWords ? words >= maxWords * 0.9 && !wordExceeded : false;
    const charWarning = maxChars ? chars >= maxChars * 0.9 && !charExceeded : false;

    return {
      wordCount: words,
      charCount: chars,
      isWordExceeded: wordExceeded,
      isCharExceeded: charExceeded,
      isWordWarning: wordWarning,
      isCharWarning: charWarning,
    };
  }, [text, maxWords, maxChars]);

  const hasError = isWordExceeded || isCharExceeded;
  const hasWarning = isWordWarning || isCharWarning;

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 text-[11px] font-medium transition-colors select-none",
        hasError
          ? "text-destructive font-semibold"
          : hasWarning
          ? "text-amber-500 dark:text-amber-400"
          : "text-muted-foreground",
        className
      )}
    >
      {maxWords !== undefined && (
        <span className={cn(isWordExceeded && "underline decoration-destructive")}>
          {wordCount} / {maxWords} words
        </span>
      )}
      {showChars && maxChars !== undefined && (
        <span>
          • {charCount} / {maxChars} chars
        </span>
      )}
      {hasError && (
        <span className="text-destructive font-bold text-[10px] uppercase tracking-wider">
          (Exceeds limit)
        </span>
      )}
    </div>
  );
}
