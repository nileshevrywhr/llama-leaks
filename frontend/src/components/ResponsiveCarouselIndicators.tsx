import React from 'react';
import { cn } from '@/lib/utils';
import { useCarousel } from '@/components/ui/carousel';

interface ResponsiveCarouselIndicatorsProps {
  className?: string;
}

const ResponsiveCarouselIndicators: React.FC<ResponsiveCarouselIndicatorsProps> = ({ 
  className 
}) => {
  const { api, scrollSnaps, selectedIndex } = useCarousel();

  const scrollTo = React.useCallback(
    (index: number) => api?.scrollTo(index),
    [api]
  );

  return (
    <div 
      className={cn(
        "flex justify-center space-x-2 mt-4",
        className
      )}
      role="tablist"
      aria-label="Carousel page indicators"
    >
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            selectedIndex === index
              ? "bg-primary scale-125"
              : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
          onClick={() => scrollTo(index)}
          role="tab"
          aria-selected={selectedIndex === index}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default ResponsiveCarouselIndicators;