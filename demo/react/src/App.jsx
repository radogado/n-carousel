import React, { useState } from 'react';
import NCarousel from 'n-carousel/react/NCarousel';

const allOptions = {
  endless: true,
  vertical: true,
  autoHeight: true,
  controlsOutside: true,
  tabs: true,
  indexAlignStart: true,
  peek: 20,
  rtl: false,
  lightbox: false,
  autoSlide: false,
  thumbnails: false,
  overlay: false,
  indexEnd: false,
  indexAlignEnd: false,
  indexAlignCenter: false,
  indexStart: false,
  inline: false,
  tabsAlignEnd: false,
  instant: false,
};

function App() {
  const [options, setOptions] = useState(allOptions);

  const handleToggle = (key) => {
    setOptions((opts) => ({ ...opts, [key]: !opts[key] }));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <h1>N-Carousel React Demo</h1>
      <p>Toggle options to see their effect:</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', marginBottom: 24 }}>
        {Object.keys(allOptions).map((key) => (
          <label key={key} style={{ minWidth: 120, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={options[key]}
              onChange={() => handleToggle(key)}
            />
            {key}
          </label>
        ))}
      </div>
      <NCarousel options={options}>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <img
            src="https://picsum.photos/800/300?random=1"
            alt="Slide 1"
            style={{ width: '100%', borderRadius: '4px' }}
          />
          <h2 style={{ marginTop: '20px' }}>First Slide</h2>
          <p>This is the first slide of the carousel.</p>
        </div>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <img
            src="https://picsum.photos/800/500?random=2"
            alt="Slide 2"
            style={{ width: '100%', borderRadius: '4px' }}
          />
          <h2 style={{ marginTop: '20px' }}>Second Slide</h2>
          <p>This is the second slide of the carousel.</p>
        </div>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <img
            src="https://picsum.photos/800/400?random=3"
            alt="Slide 3"
            style={{ width: '100%', borderRadius: '4px' }}
          />
          <h2 style={{ marginTop: '20px' }}>Third Slide</h2>
          <p>This is the third slide of the carousel.</p>
        </div>
      </NCarousel>
    </div>
  );
}

export default App; 