// Recharge Room Service Worker
// Provides offline functionality and caching for the wellness dashboard

const CACHE_NAME = 'recharge-room-v1.0.0';
const STATIC_CACHE_NAME = 'recharge-room-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'recharge-room-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/manifest.json',
  // Add other critical static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/health/,
  /\/api\/auth/,
  /\/api\/dashboard/,
  /\/api\/tasks/,
  /\/api\/mood/,
  /\/api\/journal/,
  /\/api\/voice/,
  /\/api\/rewards/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static assets - cache first strategy
    if (isStaticAsset(request)) {
      event.respondWith(cacheFirstStrategy(request));
    }
    // API requests - network first with fallback
    else if (isApiRequest(request)) {
      event.respondWith(networkFirstStrategy(request));
    }
    // Other requests - network first
    else {
      event.respondWith(networkFirstStrategy(request));
    }
  }
  // Handle POST requests for API calls
  else if (request.method === 'POST' && isApiRequest(request)) {
    event.respondWith(handleApiPost(request));
  }
});

// Cache first strategy for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network first strategy with cache fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API POST requests with offline queue
async function handleApiPost(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('API POST failed, storing for later:', error);
    
    // Store failed requests for retry when online
    const offlineQueue = await getOfflineQueue();
    offlineQueue.push({
      url: request.url,
      method: request.method,
      body: await request.clone().text(),
      timestamp: Date.now()
    });
    
    await setOfflineQueue(offlineQueue);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Request queued for when online',
      offline: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname === '/' ||
         url.pathname === '/index.html';
}

// Check if request is for API
function isApiRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Offline queue management
async function getOfflineQueue() {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const response = await cache.match('/offline-queue');
  if (response) {
    return await response.json();
  }
  return [];
}

async function setOfflineQueue(queue) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const response = new Response(JSON.stringify(queue));
  await cache.put('/offline-queue', response);
}

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

// Process queued offline requests
async function processOfflineQueue() {
  try {
    const queue = await getOfflineQueue();
    const processedQueue = [];
    
    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          body: request.body,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          console.log('Successfully processed offline request:', request.url);
        } else {
          processedQueue.push(request); // Keep for retry
        }
      } catch (error) {
        console.log('Failed to process offline request:', error);
        processedQueue.push(request); // Keep for retry
      }
    }
    
    await setOfflineQueue(processedQueue);
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-96x96.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Recharge Room Service Worker loaded successfully');




