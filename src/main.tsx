import { render } from 'preact';
import { App } from './app.tsx';
import './styles.css';

render(<App />, document.getElementById('app')!);

// Offline support in production builds only, so dev always shows fresh code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
