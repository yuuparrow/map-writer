import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GlyphDebug } from './dev/GlyphDebug';
import './styles.css';

const debugGlyph = new URLSearchParams(location.search).get('debug') === 'glyph';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{debugGlyph ? <GlyphDebug /> : <App />}</React.StrictMode>,
);
