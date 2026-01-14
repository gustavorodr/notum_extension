import React from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import '../styles.css';

// Initialize the popup app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}