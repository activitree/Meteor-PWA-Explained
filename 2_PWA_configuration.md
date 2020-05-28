* Have a manifest file available at https://yourdomain.com/manifest.json. This will be placed in your Meteor public folder: https://github.com/activitree/Meteor-PWA-Explained/blob/master/app/public/manifest-pwa.json

* Have a configuration specific for your PWA in your main html file of your Meteor webapp. This example shows the minimum meta tags for a PWA, do not copy-paste / overwrite your main.html file. Instead, add these tags to your existing head tag in your html file. https://github.com/activitree/Meteor-PWA-Explained/blob/master/app/client/main.html

* You need to register a service worker. This is a good time to read this article: https://dev.to/jankapunkt/transform-any-meteor-app-into-a-pwa-4k44

If **you don't use activitree:push**, you can follow the above mentioned article and use the service worker from this repo.
If **you use activitree:push**, the client side of the activitree:push package switches automatically between 2 service workers and it is required that you have sw.js and firebase-messaging-sw.js. The logic here is that if you add a Push configuration for Firebase Web Push with your activitree:push package, the firebase-messaging-sw.js will be installed. If a configuration for Web Push is missing, the sw.js file will be installed. The two service workers are similar with the exception that firebase-messaging-sw.js includes the necessary libraries and initialization for Web Push. Please note that activitree:push may work with Cordova or with Web Push or with both, depending on the configurations provided (documented in the package).

Put in a different perspective, if you use activitree:push, just make sure you have your 2 service worker files in your `/public` folder, otherwise, you need to have a service worker of your name of choice and install this service worker in your /client/startup.




TODO

- [ ] Add to homescreen for IOS]
- [ ] SimpleDDP - with PWA shell

