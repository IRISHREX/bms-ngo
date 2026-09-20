import { motion } from "framer-motion";

interface AnimatedLettersProps {
  text: string;
  className?: string;
  delay?: number;
}

/**
 * AnimatedLetters
 * Renders text with a staggered letter-by-letter spring transition.
 * Preserves word-wrapping boundaries by grouping letters into whitespace-nowrap word spans.
 */
export function AnimatedLetters({ text, className = "", delay = 0 }: AnimatedLettersProps) {
  const words = text.split(/\s+/).filter(Boolean);
  let globalCharIndex = 0;

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, wordIndex) => {
        const letters = word.split("");
        const wordStartIndex = globalCharIndex;
        globalCharIndex += letters.length + 1;

        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {letters.map((char, charIndex) => (
              <motion.span
                key={charIndex}
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  damping: 14,
                  stiffness: 140,
                  delay: delay + (wordStartIndex + charIndex) * 0.018,
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
            {wordIndex < words.length - 1 && (
              <span className="inline-block">&nbsp;</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
