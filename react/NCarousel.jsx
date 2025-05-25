import React, { useEffect, useRef } from 'react';
import 'n-carousel/n-carousel.min.css';

const NCarousel = ({
  children,
  className = '',
  showNavigation = true,
  showIndex = true,
  ...props
}) => {
  const carouselRef = useRef(null);

  useEffect(() => {
    // Import the carousel script dynamically
    import('n-carousel/n-carousel.min.js').then(() => {
      // The carousel will initialize automatically
    });
  }, []);

  return (
    <div 
      ref={carouselRef}
      className={`n-carousel ${className}`}
      {...props}
    >
      <div className="n-carousel__content">
        {React.Children.map(children, (child, index) => (
          <div key={index}>{child}</div>
        ))}
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
          {React.Children.map(children, (_, index) => (
            <button key={index}><span>{index + 1}</span></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NCarousel; 