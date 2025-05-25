import React from 'react';
import NCarousel from './NCarousel';

const Example = () => {
  return (
    <NCarousel>
      <div>
        <img src="image1.jpg" alt="Slide 1" />
        <h2>First Slide</h2>
      </div>
      <div>
        <img src="image2.jpg" alt="Slide 2" />
        <h2>Second Slide</h2>
      </div>
      <div>
        <img src="image3.jpg" alt="Slide 3" />
        <h2>Third Slide</h2>
      </div>
    </NCarousel>
  );
};

export default Example; 