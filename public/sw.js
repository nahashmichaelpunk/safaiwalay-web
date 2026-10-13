// Service Worker for SafaiWalay
const CACHE_NAME = 'safaiwalay-v4';
const STATIC_CACHE_URLS = [
  '/',
  '/services',
  '/areas',
  '/testimonials',
  '/about',
  '/contact',
  '/blog',
  '/Images/Logo.jpg',
  '/Images/Mascot.jpg',
  '/Images/favicon.jpg'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - restrict fallback to navigation requests only.
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const destination = event.request.destination;
  const isNavigationRequest = event.request.mode === 'navigate' || destination === 'document';
  const isStaticAssetRequest = destination === 'script' || destination === 'style' || destination === 'worker';

  // Never serve HTML fallback for JS/CSS/worker requests.
  if (isStaticAssetRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Brand images / invoice logo: always network (avoid cache-first 503 noise and stale logos).
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/Images/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // For navigation requests, use network-first with offline fallback to app shell.
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cachedPage) => cachedPage || caches.match('/')))
    );
    return;
  }

  // For other requests (images/fonts/etc.), use cache-first.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => new Response('', { status: 503 }));
    })
  );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm());
  }
});

// Sync contact form data when online
async function syncContactForm() {
  try {
    const formData = await getStoredFormData();
    if (formData) {
      await submitFormData(formData);
      await clearStoredFormData();
    }
  } catch (error) {
    console.error('Failed to sync contact form:', error);
  }
}

// Store form data in IndexedDB
async function storeFormData(data) {
  const db = await openDB();
  const transaction = db.transaction(['forms'], 'readwrite');
  const store = transaction.objectStore('forms');
  await store.put(data, 'contact-form');
}

// Get stored form data
async function getStoredFormData() {
  const db = await openDB();
  const transaction = db.transaction(['forms'], 'readonly');
  const store = transaction.objectStore('forms');
  return await store.get('contact-form');
}

// Clear stored form data
async function clearStoredFormData() {
  const db = await openDB();
  const transaction = db.transaction(['forms'], 'readwrite');
  const store = transaction.objectStore('forms');
  await store.delete('contact-form');
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SafaiWalayDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('forms')) {
        db.createObjectStore('forms');
      }
    };
  });
}

// Submit form data to server
async function submitFormData(data) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit form data');
  }
}
