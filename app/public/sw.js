/* global importScripts, workbox, clients */
/* eslint-disable no-restricted-globals */
/* eslint-disable quotes */
/* eslint-disable comma-dangle */
/* eslint-disable quote-props */

if (typeof window === 'function') {
  importScripts('http://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js')

  const APP_SHELL = '/app-shell'
  const HASHED_CACHE = 'hashedCache'

  console.log(workbox)

  // Precache all the files needed by the App Shell, as defined in workbox-config.js
  // If any of these files are updated, run `npm run update-sw` to update this file automatically.
  workbox.precaching.precacheAndRoute([
    {
      "url": "manifest-pwa.json",
      "revision": "4f38d508be7b0109c332db24b2c3398c"
    }
  ])

  // Cache the App Shell route. We try to get latest from the network, fall back to cache for offline.
  //
  // Workbox's `registerNavigationRoute` helper will always try the cache first, and this causes Meteor's
  // hot code pushing to enter an infinite loop (Meteor requests a reload, the service worker returns the old
  // cached version, so Meteor requests a reload, and so on). So, rather than using the helper, we'll register
  // a new `NavigationRoute` ourselves, so that we can supply a handler.
  //
  // We'd like to use the `NetworkFirst` strategy, but the normal version will always try to fetch and cache
  // the route that's being accessed. We override the class to force the request to be our app-shell url.

  class NetworkFirstToFixedRoute extends workbox.strategies.NetworkFirst {
    constructor (url, options = {}) {
      super(options)
      this.url = url
    }

    async handle ({ event }) {
      console.log(event)
      return this.handle({
        event,
        request: this.url,
      })
    }
  }

  // Finally, we can register a navigation route with a the custom handler that always fetches from `APP_SHELL`;
  workbox.routing.registerRoute(new workbox.routing.NavigationRoute(new NetworkFirstToFixedRoute(APP_SHELL)))

  workbox.clientsClaim()

  // eslint-disable-next-line no-inner-declarations
  function removeHash (element) {
    if (typeof element === 'string') return element.split('?hash=')[0]
    return element
  }

  // eslint-disable-next-line no-inner-declarations
  function hasSameHash (firstUrl, secondUrl) {
    if (typeof firstUrl === 'string' && typeof secondUrl === 'string') {
      return /\?hash=(.*)/.exec(firstUrl)[1] === /\?hash=(.*)/.exec(secondUrl)[1]
    }

    return false
  }

  // Use our own cache for all hashed assets (Meteor generates the hashes for us)
  // Old versions of a given URL are replaced when a version with a different hash is
  // requested, otherwise we always return the cached version.
  //
  // We also need to make sure that we eventually delete files that are no longer used
  // at all. We assume that once a file hasn't been used for a few weeks it's no longer
  // useful. We use Workbox's CacheExpiration module to expire all the old files.

  const expirationManager = new workbox.expiration.CacheExpiration(
    HASHED_CACHE,
    {
      maxAgeSeconds: 4 * 7 * 24 * 60 * 60
    }
  )

  workbox.routing.registerRoute(/\?hash=.*/, ({ url, event }) => {
    // eslint-disable-next-line no-undef
    caches.open(HASHED_CACHE).then((cache) => {
      const req = event.request.clone()

      return cache.match(req).then((cached) => {
        // Return the cached version if the hash is the same (updating the timestamp in the expiration manager)
        if (cached && hasSameHash(url.toString(), cached.url.toString())) {
          return expirationManager.updateTimestamp(url.toString()).then(() => cached)
        }

        // Try to fetch it....
        // eslint-disable-next-line no-undef
        return fetch(req).then((response) => {
          const clonedResponse = response.clone()

          if (!clonedResponse || clonedResponse.status !== 200 || clonedResponse.type !== 'basic') {
            return response
          }

          // Remove all other versions of this file frome the cache
          const re = new RegExp(removeHash(url.toString()))
          // eslint-disable-next-line no-undef
          caches.open(HASHED_CACHE).then(hashCache => hashCache.keys().then(keys => keys.forEach((asset) => {
            if (re.test(removeHash(asset.url.toString()))) {
              hashCache.delete(asset)
            }
          })))

          // Cache this version
          // eslint-disable-next-line no-undef
          caches.open(HASHED_CACHE)
            .then(hashCache => hashCache.put(event.request, clonedResponse))
            .then(() => expirationManager.updateTimestamp(url.toString()))

          // Return it
          return response
        })
      })
    })
      .then(() => { expirationManager.expireEntries() })
      .catch(e => console.log(`Service worker threw ${e}`))
  })

  // Push event listener aux function:
  const showNotification = evt => {
    // eslint-disable-next-line no-undef
    if (!(self.Notification && self.Notification.permission === 'granted')) {
      return
    }

    const title = 'Push notification demo'
    const options = {
      body: evt.data && evt.data.text() ? evt.data.text() : 'Push message no payload',
      tag: 'demo',
      icon: 'https://assets.activitree.com/images/assets/icon-192x192.png',
      badge: 'https://assets.activitree.com/images/assets/icon-192x192.png',
      // Custom actions buttons
      actions: [
        { action: 'yes', title: 'I ♥ this app!' },
        { action: 'no', title: 'I don\'t like this app' },
      ],
    }

    evt.waitUntil(
      // eslint-disable-next-line no-undef
      self.registration.showNotification(title, options),
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

  // eslint-disable-next-line no-undef
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

  // eslint-disable-next-line no-undef
  self.addEventListener('notificationclick', evt => {
    console.log('[Service Worker] Notification click Received.')

    // eslint-disable-next-line no-undef
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

    // Close all notifications (thisincludes any other notifications from the
    // same origin)
    // Source: https://developers.google.com/web/ilt/pwa/introduction-to-push-notifications
    // eslint-disable-next-line no-undef
    self.registration.getNotifications()
      .then((notifications) => {
        notifications.forEach((notification) => { notification.close() })
      })
  })
}
