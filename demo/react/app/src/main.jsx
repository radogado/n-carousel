import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// The main demo CSS expects the `.demo` carousel to be a direct child of <body>.
// We mount React into a separate container and let the App insert the demo element
// directly into <body> (outside the React subtree).
const reactRoot = document.createElement('div');
reactRoot.id = 'react-root';
document.body.appendChild(reactRoot);

createRoot(reactRoot).render(
  <App />
);


