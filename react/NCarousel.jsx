import React, { useEffect, useRef, useMemo } from 'react';
import '../n-carousel.min.css';

// Map camelCase option keys to n-carousel--* classes
const optionClassMap = {
  vertical: 'n-carousel--vertical',
  autoHeight: 'n-carousel--auto-height',
  overlay: 'n-carousel--overlay',
  endless: 'n-carousel--endless',
  inline: 'n-carousel--inline',
  indexEnd: 'n-carousel--index-end',
  indexAlignEnd: 'n-carousel--index-align-end',
  peek: 'n-carousel--peek',
  rtl: 'n-carousel--rtl',
  indexAlignCenter: 'n-carousel--index-align-center',
  indexAlignStart: 'n-carousel--index-align-start',
  indexStart: 'n-carousel--index-start',
  controlsOutside: 'n-carousel--controls-outside',
  thumbnails: 'n-carousel--thumbnails',
  tabs: 'n-carousel--tabs',
  lightbox: 'n-carousel--lightbox',
  autoSlide: 'n-carousel--auto-slide',
  tabsAlignEnd: 'n-carousel--tabs-align-end',
  instant: 'n-carousel--instant',
};

// Load carousel script once (module-level)
let carouselScriptLoaded = false;
const loadCarouselScript = () => {
  if (!carouselScriptLoaded) {
    carouselScriptLoaded = true;
    return import('../n-carousel.min.js');
  }
  return Promise.resolve();
};

const NCarousel = ({
  children,
  className = '',
  showNavigation = true,
  showIndex = true,
  options = {},
  ...props
}) => {
  const carouselRef = useRef(null);

  useEffect(() => {
    // Import the carousel script dynamically (only once)
    loadCarouselScript().catch((error) => {
      console.error('Failed to load n-carousel script:', error);
    });
  }, []);

  // Memoize option classes computation
  const optionClasses = useMemo(() => {
    return Object.entries(options)
      .filter(([key, value]) => value && optionClassMap[key])
      .map(([key]) => optionClassMap[key])
      .join(' ');
  }, [options]);

  return (
    <div 
      ref={carouselRef}
      className={`n-carousel ${optionClasses} ${className}`.trim()}
      {...props}
    >
      <div className="n-carousel__content">
        {React.Children.map(children, (child, index) => {
          // Use stable key based on child's key or index
          const key = React.isValidElement(child) && child.key != null 
            ? child.key 
            : `slide-${index}`;
          return <div key={key}>{child}</div>;
        })}
      </div>
      
      {showNavigation && (
        <>
          <div className="n-carousel__previous">
            <button><span>Previous</span></button>
          </div>
          <div className="n-carousel__next">
            <button><span>Next</span></button>
          </div>
        </>
      )}

      {showIndex && (
        <div className="n-carousel__index">
          {React.Children.map(children, (child, index) => {
            const key = React.isValidElement(child) && child.key != null 
              ? child.key 
              : `index-${index}`;
            return (
              <button key={key}><span>{index + 1}</span></button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NCarousel; 