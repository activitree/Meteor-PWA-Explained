**Concepts:**

* PWAs require a set of configurations that are mostly targetted to making a website/webapp usable in full screen on a mobile device or desktop (framed like a native app). (Explained: https://github.com/activitree/Meteor-PWA-Explained/blob/master/2_PWA_configuration.md)
* With the help of service workers, your PWA can become smarter and be able to cache files, communicate with external APIs or resources and receive Push notifications when they are not in use. (https://github.com/activitree/Meteor-PWA-Explained/blob/master/3_Service_workers.md)
* PWA is a way of utilizing/viewing a webapp but you can make use of service workers without configuring your webapp as a power app(PWA) for cases such as: speed up websites/webapps with the use of locally cached files, receive notifications.

This documentation is slightly opinionated and it uses Google Firbase for the Web Push technology. Caching strategies are used as example, you can use as is or adapt/improve for your own specific use. The example uses separate cache folders in order to better clarify how different files are moving around.

The documentation suggest the use of activitree:push (https://github.com/activitree/meteor-push or https://atmospherejs.com/activitree/push ) but you can use any Push infrastructure and implement the specific bits in your web service worker. The activitree:push package implements Push notifications for Cordova and Web over the Google Firebase (FCM) public infrastructure. If you are new to Push, you need to first know that Push is not a "Meteor thing", the Meteor implementation of Push does mainly three things:
  * Meteor server authenticates in the public Googel Firebase infrastructure in order to send notifications to device tokens
  * Meteor server saves to its own MongoDB device tokens and associates them with user Ids.
  * Meteor client get the device token from the user (Cordova or Web) and pass it to the Meteor server.
  
