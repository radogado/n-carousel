import React, { useMemo, useRef } from 'react';
import { useNCarousel } from './useNCarousel';

export type NCarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Dependency list to re-init when your slides/controls change.
   * Example: deps={[slides.length]}
   */
  deps?: React.DependencyList;
};

export function NCarousel({ deps, children, ...props }: NCarouselProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const depList = useMemo(() => deps ?? [], [deps]);
  useNCarousel(ref, depList);
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}


