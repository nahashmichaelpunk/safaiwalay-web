import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import SEOProvider from './components/seo/SEOProvider.tsx';
import PerformanceMonitor from './components/PerformanceMonitor.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import { assertMonitoringConfig } from './lib/monitoring/config.ts';
import { initGlobalErrorMonitoring } from './lib/monitoring/error-logger.ts';
import { logger } from './lib/logger.ts';
import './index.css';

assertMonitoringConfig();
initGlobalErrorMonitoring();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.info('SW registered: ', registration);
      })
      .catch((registrationError) => {
        logger.warn('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <SEOProvider>
        <PerformanceMonitor />
        <App />
      </SEOProvider>
    </AppErrorBoundary>
  </StrictMode>
);
