/* global importScripts, workbox, clients */

const debug = true // When true the build is for development. Set false for Production version.

/**
 * Select the file strategy
 * 1. When offline, serve the JS, CSS bundle and the present route if cached
 * 2. When offline, server and HTML file
 */
const fileStrategy = 1

if (typeof importScripts === 'function') {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js')
  workbox.setConfig({ debug })
  const APP_SHELL = '/app-shell'
  const BUNDLE_CACHE = 'bundleCache'
  const { precaching /* , googleAnalytics */ } = workbox
  const registerRoute = workbox.routing.registerRoute
  const NavigationRoute = workbox.routing.NavigationRoute
  const { NetworkFirst } = workbox.strategies
  const { skipWaiting, clientsClaim } = workbox.core

  /**
   * Enable for offline google analytics
   */
  // googleAnalytics.initialize()

  precaching.precacheAndRoute([])

  const strategy = new NetworkFirst(APP_SHELL)
  registerRoute(new NavigationRoute(strategy))

  skipWaiting() // when a worker is updated and sent to the client, do not wait for the user to manually confirm the swap
  clientsClaim()

  const match = /meteor_css_resource=true|meteor_js_resource=true/

  const handlerCb = ({ url, event }) => {
    return caches.open(BUNDLE_CACHE)
      .then(bundleCache => {
        return bundleCache
          .match(url.pathname + url.search)
          .then(cached => {
            if (cached) {
              // console.log('I am returning the cached: ', cached)
              return cached
            }
            /**
             * If not in cache, fetch and add to the cache
             */
            return fetch(event.request)
              .then(response => {
                const clonedResponse = response.clone()
                const finalResponse = response.clone()
                caches.open(BUNDLE_CACHE)
                  .then(bundle => bundleCache.keys()
                    .then(cacheNames => {
                      cacheNames.forEach(cacheName => {
                        const fileType = cacheName.url.substr(cacheName.url.indexOf('?'))
                        if (fileType === url.search) {
                          console.log('I delete a bundle delete this keys: ', cacheName)
                          bundleCache.delete(cacheName)
                        }
                      })
                    })
                    .then(() => bundle.put(response.url, clonedResponse))
                  )
                  // .then(() => cacheExpiration.updateTimestamp(response.url))
                  .catch(e => console.log(`Service worker threw here ${e}`))
                return finalResponse
              })
              .catch(e => console.log(`Error fetching from live ${e}`))
          })
          .catch(e => console.log(`Error fetching from live ${e}`))
      })
      .catch(e => console.log(`Service worker threw there ${e}`))
  }

  if (fileStrategy === 1) {
    registerRoute(match, handlerCb)
  }

  // THIS (below to the end) IS ONLY RELEVANT IF YOU USE PUSH NOTIFICATIONS FOR PWA
  // Push event listener:

  const showNotification = evt => {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
      return
    }

    const title = 'Push notification demo'
    const options = {
      body: evt.data && evt.data.text() ? evt.data.text() : 'Push message no payload',
      tag: 'demo',
      icon: 'https://assets.activitree.com/images/assets/icon-192x192.png', // these are sample images
      badge: 'https://assets.activitree.com/images/assets/icon-192x192.png', // these are sample images
      // Custom actions buttons
      actions: [
        { action: 'yes', title: 'I ♥ this app!' },
        { action: 'no', title: 'I don\'t like this app' }
      ]
    }

    evt.waitUntil(
      self.registration.showNotification(title, options)
    )
  }

  // When to Show Notifications:
  // If the user is already using your application there is no need to display a
  // notification. You can manage this logic on the server, but it is easier to
  // do it in the push handler inside your service worker:
  // the 'clients' global in the service worker lists all of the active push
  // clients on this machine. If there are no clients active, the user must be
  // in another app. We should show a notification in this case. If there are
  // active clients it means that the user has your site open in one or more
  // windows. The best practice is to relay the message to each of those windows.
  // Source: https://developers.google.com/web/ilt/pwa/introduction-to-push-notifications
  // Source: https://developers.google.com/web/fundamentals/codelabs/push-notifications/

  self.addEventListener('push', evt => {
    console.log('[Service Worker] Push Received.')
    console.log(`[Service Worker] Push had this data: "${evt && evt.data}"`)

    // Comment out the following line in case you only want to display
    // notifications when the app isn't open
    showNotification(evt)

    clients.matchAll()
      .then((client) => {
        if (client.length === 0) {
          // Un-comment the following line in case you only want to display
          // notifications when the app isn't open
          // showNotification(evt);
        } else {
          // Send a message to the page to update the UI
          console.log('Application is already open!')
        }
      })
  })

  // The code below looks for the first window with 'visibilityState' set to
  // 'visible'. If one is found it navigates that client to the correct URL and
  // focuses the window. If a window that suits our needs is not found, it
  // opens a new window.
  // Source: https://developers.google.com/web/fundamentals/codelabs/push-notifications/
  // Source: https://developers.google.com/web/ilt/pwa/introduction-to-push-notifications

  self.addEventListener('notificationclick', evt => {
    console.log('[Service Worker] Notification click Received.')

    const appUrl = new URL('/', location).href

    // Listen to custom action buttons in push notification
    if (evt.action === 'yes') {
      console.log('I ♥ this app!')
    } else if (evt.action === 'no') {
      console.log('I don\'t like this app')
    }

    evt.waitUntil(
      clients.matchAll()
        .then((clientsList) => {
          const client = clientsList.find(c => (
            c.visibilityState === 'visible'
          ))

          if (client !== undefined) {
            client.navigate(appUrl)
            client.focus()
          } else {
            // There are no visible windows. Open one.
            clients.openWindow(appUrl)
          }
        })
    )

    // Close all notifications (this includes any other notifications from the same origin)
    // Source: https://developers.google.com/web/ilt/pwa/introduction-to-push-notifications
    self.registration.getNotifications()
      .then((notifications) => {
        notifications.forEach((notification) => { notification.close() })
      })
  })
}
