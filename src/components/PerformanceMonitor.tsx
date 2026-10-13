import { useEffect } from 'react';
import { trackEvent } from '@/lib/monitoring/events';

import { logger } from '@/lib/logger';

/** The Layout Instability API is not part of lib.dom yet. */
interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

function devLog(...args: unknown[]) {
  logger.debug(...args);
}

// Performance monitoring utilities
export const measurePerformance = () => {
  if (typeof window === 'undefined') return;

  // Measure Core Web Vitals
  const measureWebVitals = () => {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.startTime;
      
      trackEvent('web_vital', { metric_name: 'LCP', metric_value: Math.round(lcp) });

      devLog('LCP:', lcp);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        
        trackEvent('web_vital', { metric_name: 'FID', metric_value: Math.round(fid) });

        devLog('FID:', fid);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const shift = entry as LayoutShiftEntry;
        if (!shift.hadRecentInput) {
          clsValue += shift.value;
        }
      });
      
      trackEvent('web_vital', {
        metric_name: 'CLS',
        metric_value: Math.round(clsValue * 1000),
      });

      devLog('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // First Contentful Paint (FCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const fcp = entry.startTime;
        
        trackEvent('web_vital', { metric_name: 'FCP', metric_value: Math.round(fcp) });

        devLog('FCP:', fcp);
      });
    }).observe({ entryTypes: ['paint'] });
  };

  // Measure page load time
  const measurePageLoad = () => {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      const totalLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      trackEvent('seo_metric', { metric: 'performance_load_time', value: Math.round(loadTime) });
      trackEvent('seo_metric', {
        metric: 'performance_dom_content_loaded',
        value: Math.round(domContentLoaded),
      });
      trackEvent('seo_metric', {
        metric: 'performance_total_load_time',
        value: Math.round(totalLoadTime),
      });

      devLog('Page Load Metrics:', {
        loadTime,
        domContentLoaded,
        totalLoadTime,
      });
    });
  };

  // Measure resource loading
  const measureResourceLoading = () => {
    const resources = performance.getEntriesByType('resource');
    
    resources.forEach((entry) => {
      const resource = entry as PerformanceResourceTiming;
      const loadTime = resource.responseEnd - resource.startTime;
      const resourceType = resource.initiatorType;
      
      if (loadTime > 1000) { // Only track slow resources (>1s)
        trackEvent('seo_metric', {
          metric: `slow_resource_${resourceType}`,
          value: Math.round(loadTime),
        });
      }
    });
  };

  // Initialize all measurements
  measureWebVitals();
  measurePageLoad();
  
  // Measure resources after a delay to ensure all are loaded
  setTimeout(measureResourceLoading, 3000);
};

// SEO Performance Monitor
export const measureSEOPerformance = () => {
  if (typeof window === 'undefined') return;

  // Check for missing meta tags
  const checkMetaTags = () => {
    const requiredMetaTags = [
      'description',
      'keywords',
      'viewport',
      'og:title',
      'og:description',
      'og:image',
      'twitter:card'
    ];

    const missingTags = requiredMetaTags.filter(tag => {
      if (tag.startsWith('og:') || tag.startsWith('twitter:')) {
        return !document.querySelector(`meta[property="${tag}"]`) && 
               !document.querySelector(`meta[name="${tag}"]`);
      }
      return !document.querySelector(`meta[name="${tag}"]`);
    });

    if (missingTags.length > 0) {
      trackEvent('seo_issue', { issue: 'missing_meta_tags', count: missingTags.length });
      console.warn('Missing meta tags:', missingTags);
    }
  };

  // Check for missing alt tags on images
  const checkImageAltTags = () => {
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    
    if (imagesWithoutAlt.length > 0) {
      trackEvent('seo_issue', { issue: 'images_without_alt', count: imagesWithoutAlt.length });
      console.warn('Images without alt tags:', imagesWithoutAlt.length);
    }
  };

  // Check for proper heading structure
  const checkHeadingStructure = () => {
    const h1s = document.querySelectorAll('h1');

    if (h1s.length === 0) {
      trackEvent('seo_issue', { issue: 'missing_h1', count: 1 });
      console.warn('No H1 tag found');
    }
    
    if (h1s.length > 1) {
      trackEvent('seo_issue', { issue: 'multiple_h1', count: h1s.length });
      console.warn('Multiple H1 tags found:', h1s.length);
    }
  };

  // Check for internal linking
  const checkInternalLinking = () => {
    const links = document.querySelectorAll('a[href]');
    const internalLinks = Array.from(links).filter(link => {
      const href = link.getAttribute('href');
      return href && (href.startsWith('/') || href.includes(window.location.hostname));
    });
    
    trackEvent('seo_metric', { metric: 'internal_links_count', value: internalLinks.length });
  };

  // Run SEO checks after paint so route content (incl. H1) is mounted; avoids false "No H1" on shell
  const runSeoChecks = () => {
    checkMetaTags();
    checkImageAltTags();
    checkHeadingStructure();
    checkInternalLinking();
  };
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => runSeoChecks(), { timeout: 3000 });
  } else {
    setTimeout(runSeoChecks, 2000);
  }
};

// Performance Monitor Component
export default function PerformanceMonitor() {
  useEffect(() => {
    // Vite: use import.meta.env.PROD (not process.env in browser bundle)
    if (import.meta.env.PROD) {
      measurePerformance();
      measureSEOPerformance();
    }
  }, []);

  return null;
}
