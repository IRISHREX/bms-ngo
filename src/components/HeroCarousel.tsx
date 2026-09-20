import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchHeroSlides } from "@/lib/api";
import heroImage from "@/assets/hero-image.jpg";

export function HeroCarousel() {
  const { data: slides = [] } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: fetchHeroSlides,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // If slides change and index is out of bounds, reset
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides, currentIndex]);

  // Auto-advance every 5 seconds if more than 1 slide
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handlePrev = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // If no custom slides, display the default hero image
  if (slides.length === 0) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImage}
          alt="Rural children studying in an open-air classroom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
      </div>
    );
  }

  const activeSlide = slides[currentIndex];

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Crossfade */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeSlide?.id || currentIndex}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={activeSlide?.imageUrl || heroImage}
            alt="Hero slide"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default image if remote file fails to load
              (e.currentTarget as HTMLImageElement).src = heroImage;
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30 z-10" />

      {/* Navigation arrows if multiple slides */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-background/30 hover:bg-background/60 text-background flex items-center justify-center backdrop-blur-md border border-background/20 transition-all hover:scale-105"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-background/30 hover:bg-background/60 text-background flex items-center justify-center backdrop-blur-md border border-background/20 transition-all hover:scale-105"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Carousel Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-7 bg-primary"
                  : "w-2 bg-background/40 hover:bg-background/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
