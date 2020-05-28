1. If **you don't use activitree:push**, you can follow the PWA article (https://dev.to/jankapunkt/transform-any-meteor-app-into-a-pwa-4k44) and use the service worker from this repo.

2. If **you use activitree:push**, the client side of the activitree:push package switches automatically between 2 service workers and it is required that you have sw.js and firebase-messaging-sw.js.
The logic here is that if you add a Web Push configuration for Firebase Web Push with your activitree:push package (https://github.com/activitree/meteor-push/blob/master/example/app/startup/client/index.js), the firebase-messaging-sw.js will be installed by the browser. If a configuration for Web Push is missing, the sw.js file will be installed. The two service workers are similar with the exception that firebase-messaging-sw.js includes the necessary libraries and initialization for Web Push. Please note that activitree:push may work with Cordova or with Web Push or with both, depending on the configurations provided (documented in the package).

Put in a different perspective, if you use activitree:push, just make sure you have your 2 service worker files in your `/public` folder and activitree:push will do the installation job, otherwise, you need to have a service worker of your name of choice and install this service worker in your /startup/client.

**Example:** if you have a service worker named sw.js in your public folder, you could call this in your startup/client:

```javascript
if (Meteor.isProduction) {
  const isFacebookApp = () => { // you may prefer not to install a service worker in in-app browsers like the FB browser inside the FB app.
    const ua = navigator.userAgent || navigator.vendor || window.opera
    return (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1)
  }

  if ('serviceWorker' in navigator && !isFacebookApp()) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // console.log('SW')
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err)
      })

    // Refresh all tabs after a service worker update takes place
    let refreshing
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) { return }
      refreshing = true
      window.location.reload()
    })
  }
}
```

This is the service worker proposed by this documentation, exaplained in-line. This is not the best nor the worst, it is something that works for us and covers a more general case. This should/could improve with your help.

Before this please note the existence of `not-connected.html` file in your `/public` folder https://github.com/activitree/Meteor-PWA-Explained/blob/master/app/public/not-connected.html. We use this file to display a page when we sense something is wrong with our connection to the Meteor server.

What we do here:

1. We precache some files which we need to be available right after the service worker installation. This is not a good place to cache a lot of files, we keep it at the minimum.
2. We listen to the Install of the service worker (this is a one time process per version of service worker. It installs once in a browser and remains installed until this service worker no longer exist in our app or it changes name.
3. We liste to the Activation of the service worker. At this time we check if the service worker version has changed (we keep track of versions here: `const VERSION = 'v2'`). If it did change, we delete the whole cache and we expect that step 2 above has already precached new versions of the precache files.
4. We start sniffing the traffic and mange different files in different ways using some strategies:
  * if we have a new Meteor bundle file for either CSS or JS we cache it and delete the previously cached bundle file (if any). Further calls for the bundle files by the browser will be delivered from the cache.
  * similarly we manage all other assets that we want to use on a cache-first basis, except that they don't really change names so we don't bother to delete them. We suggest you read more about the expiration of cached files if you want to refresh them more often then ... never.
  * we let the rest of the traffic pass and we make sure all cached files and our public files are still available at example.com/robots.txt or example.com/sitemap.xml, etc. These files should be on a Network First strategy.
5. We manage the situations when no connection is available. This is explained here: https://github.com/activitree/Meteor-PWA-Explained/blob/master/6_Offline_Page.md



**/public/sw.js**

```javascript
/* globals importScripts, firebase, clients */

/**
 * Caching of files and offline support
 */
/* eslint-env worker */
/* eslint-env serviceworker */

/**
 * Project Level Configurations
 */

const debug = false
const OFFLINE_HTML = '/not-connected.html'
const MANIFEST = '/manifest-pwa.json'
const PROJECT_NAME = 'Activitree'
const VERSION = 'v2'

/**
 * Web Worker Constants
 */
const BUNDLE_CACHE = `${PROJECT_NAME}-bundleCache-${VERSION}`
const PRECACHE_CACHE = `${PROJECT_NAME}-preCache-${VERSION}`
const ASSETS_CACHE = `${PROJECT_NAME}-assetsCache-${VERSION}`
const isBundleFile = str => { return /_resource=true/.test(str) }
const isJSBundleFile = str => { return /_js_/.test(str) }
const filesToCacheOnInstall = [
  OFFLINE_HTML,
  MANIFEST,
  '/?homescreen=1'
]
const assetsRegex = /isometric|activitree\.com\/activities/ // just place your onw regex here.


// function declaration, will use it further down.
const returnOffline = () => {
  return caches.open(PRECACHE_CACHE)
    .then(cache => {
      return cache
        .match(OFFLINE_HTML)
        .then(cached => cached)
        .catch(err => console.log('there was an error on catching the cache', err))
    })
}

// function declaration, will use it further down.
const cacheFirstStrategyCaching = (isBundleFile, event) => {
  event.respondWith((async () => {
    try {
      const requestToFetch = event.request.clone()
      return caches.open(isBundleFile ? BUNDLE_CACHE : ASSETS_CACHE) // switch the cache folder
        .then(cache => {
          return cache
            .match(event.request.url)
            .then(cached => {
              if (cached) {
                if (debug) { console.info('I am returning the cached file: ', cached) }
                return cached
              }
              // if not in cache, fetch it
              return fetch(requestToFetch, isBundleFile ? {} : { mode: 'cors' }) // fetch(requestToFetch), without options, if you don't use external CDNs at a different origin than your own webapp.
                .then(response => {
                  if (debug) { console.log('What do I have in this response? ', response.clone()) }
                  const clonedResponse = response.clone()
                  if (response.clone().status === 200) { // Only delete the old and cache the new one if we avail of the new file.(other possibilities are to get a 404 and we don't want to cache that.)
                    if (debug) { console.log('I do have a status response 200 here') }
                    return caches.open(isBundleFile ? BUNDLE_CACHE : ASSETS_CACHE)
                      .then(cache => cache.keys()
                        .then(cacheNames => {
                          if (isBundleFile) {
                            cacheNames.map(cacheName => {
                              if ((isJSBundleFile(cacheName.url) && isJSBundleFile(event.request.url)) || (!isJSBundleFile(cacheName.url) && !isJSBundleFile(event.request.url))) {
                                if (debug) { console.info('I delete a bundle file - delete this keys: ', cacheName) }
                                cache.delete(cacheName)
                              }
                            })
                          }
                        })
                        .then(
                          () => {
                            cache.put(response.url, clonedResponse)
                            if (debug) { console.info('Reached the end, it was a new Meteor build, old files deleted, new ones in place, returning response (new files)', response.clone()) }
                            return response.clone()
                          }
                        )
                      )
                  } else {
                    if (debug) { console.info('I should reach here when a bundle changed and I need to return the new bundle after I cached it)', response.clone()) }
                    return response.clone()
                  }
                })
            })
        })
    } catch (error) {
      console.log('Fetch failed; returning offline page instead.', error)
    }
  })())
}


/**
 * Web Workers Specific Listener: install
 */
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(PRECACHE_CACHE)
      .then(cache => cache.addAll(filesToCacheOnInstall))
  )
})

/**
 * Web Workers Specific Listener: activate
 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames =>
      cacheNames.map(cacheName => {
        if ((cacheName.indexOf('bundleCache') !== -1 && cacheName !== BUNDLE_CACHE) ||
          (cacheName.indexOf('preCache') !== -1 && cacheName !== PRECACHE_CACHE) ||
          (cacheName.indexOf('assetsCache') !== -1 && cacheName !== ASSETS_CACHE)) {
          return caches.delete(cacheName)
        }
      }))
  )
})

/**
 * Web Worker Specific Listener: fetch
 */
self.addEventListener('fetch', event => {
  self.clients.claim()
  // Bundle files JS and CSS management. If new names are detected while calling the bundle files from the cache, the olds files are deleted and the new ones cached.
  if (isBundleFile(event.request.url)) {
    if (debug) { console.log('My event request url for bundle file: ', event.request.url) }
    cacheFirstStrategyCaching(true, event)
  } else {
    // I only need to return this once if I need this exact path (but I only use it for offline PWA Lighthouse test)
    if (/\?homescreen/.test(event.request.url)) {
      event.respondWith(fetch(event.request.clone())
        // .then(response => response)
        .catch(error => {
          if (debug) { console.log('Failed on homescreen fetch: ', error) }
          return returnOffline()
        })
      )
    }

    // manifest-pwa.json is on a CacheFirst strategy. Fallback goes to network but that ideally should never happen .
    if (/manifest-pwa/.test(event.request.url)) {
      event.respondWith(async function () {
        const cachedResponse = await caches.open(PRECACHE_CACHE)
          .then(cache => {
            return cache
              .match(event.request.url)
              .then(cached => cached)
          })
        if (cachedResponse) { return cachedResponse }
        return fetch(event.request)
      }())
    }

    if (/a.txt/.test(event.request.url)) {
      // console.info('%cROUTING IS INVOLVED', { color: 'red' })
      event.respondWith(
        fetch(event.request.clone())
          // .then(response => response)
          .catch(error => {
            console.log('Failed to route, probably disconnected: ', error)
            return returnOffline()
          })
      )
    }

   // Cache first strategy for my assets files / other files.
    if (assetsRegex.test(event.request.url)) {
      cacheFirstStrategyCaching(false, event)
    }

    // Next is a NetworkFirst (or Network Only) strategy and is intended to let every traffic pass through unless handled by the above IF's
    // except the pre-cached files which I would prefer to have from the cache. Without these files, when offline, I cannot
    // route to where I need. This was implemented with React Router. If I don't ignore robots, sitemap etc the browser will
    // route to these locations instead of returning the files (those Routes do not exist e.g. www.website.com/robots.txt
    // but there is a public file there which is what I want.)
    if (event.request.mode === 'navigate' &&
      !/robots|sitemap|\?homescreen|manifest-pwa|a.txt/.test(event.request.url &&
      !assetsRegex.test(event.request.url // this is already being handled in a fetch above
    ) {
      const requestToFetch = event.request.clone()
      event.respondWith(
        fetch(requestToFetch)
          .then(response => {
            return caches.open(PRECACHE_CACHE)
              .then(cache => {
                return cache
                  .match(event.request.url)
                  .then(cached => {
                    return cached || response
                  })
              })
          })
          .catch(error => {
            if (debug) { console.log('I am probably offline. You can\'t see me because I run very fast in debug screen ', error) }
            return returnOffline() // no cache and no live return the offline page (Pure HTML)
          })
      )
    }
  }
})
```
**/public/firebase-messaging-sw.js**

```javascript
// all the above plus the following

// import firebase scripts inside service worker js script
importScripts('https://www.gstatic.com/firebasejs/7.14.5/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/7.14.5/firebase-messaging.js')

// the following credentials are from your Google Firebase project for your app. They are public data and you can just make sure to restrict the use of the apiKey by your own domain only.

firebase.initializeApp({ projectId: 'xxxxxx', apiKey: 'xxxxxx', appId: 'xxxxxx', messagingSenderId: 'xxxxxx' })
const messaging = firebase.messaging()

self.addEventListener('notificationclick', event => {
  if (event.action) {
    clients.openWindow(event.action)
  }
  event.notification.close()
})

```
