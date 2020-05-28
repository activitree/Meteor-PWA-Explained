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
