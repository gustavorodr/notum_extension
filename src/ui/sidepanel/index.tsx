import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanelApp } from './SidePanelApp';
import '../styles.css';

// Initialize the side panel app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanelApp />);
}