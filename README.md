# Meteor PWA Explained
Demonstrate the use of PWA and service workers in Meteor 1.8+ Project

<a href="https://www.repostatus.org/#active"><img src="https://www.repostatus.org/badges/latest/active.svg" alt="Project Status: Active – The project has reached a stable, usable state and is being actively developed." /></a>

**This is running in production with https://www.activitree.com**

<img alt="Activitree" src="https://assets.activitree.com/images/ad_banner.jpg" width="100%">


* **This is not a Meteor project/app.** The folder structure represents where each and every file should exist in your project. 

* sw.js contains the necessary service worker installation, activation and newtork strategies for caching and delivery of the Meteor bundle files and other assets. This also handles the offline experience (show an offline HTML page).

* firebase-messaging-sw.js contains the above (sw.js) plus an example of configuration and listeners for Web Push Notifications which has been tested with activitree:push.

You can refer to https://www.activitree.com where these are implemented as presented in this documentation. This will help you understand debugging and what exactly you can expect from your own implementation.

* How it works. There are multiple scenarios (strategies) and similarly you can change to your needs:
    * The PWA manifest is being precached. This means that it will load the first time any page is being rendered. At the time of first load only files in pre-cacheing are being loaded. After the first load, since now we have a manifest and the PWA knows what to do, on consequent loads of pages the service worker will load assets and pages as per the strategies defined.
    * The two main Meteor bundle files (JS and CSS) are being cached locally whenever a new file is detected (detection is done by filename which is unique for every production bundle release (if either JS or CSS have been modified). Once the two files are cached, they will always be served from the cache storage (in Chrome - Cache Storage) or from the browser cache whatever the browser prefers to do.
    * Every other page (route) is beinge fetch-sniffed if refreshed / opened. Since most Meteor Webapps behave like SPAs, unless you refresh a page, just routing to it will not produce a reload of that page(like a Wordpress would do for insance). The strategy here is "network first". The route comes from network when online. When offline, this route + the two Meteor bundle files (CSS and JS) should be enough to do a minimum rendering of the respective page (depending on what assets have been cached.)
    * You can add as many strategies you want. For example, images that you know will not change for a long time can be cached with a "Cache First" strategy (as if they were served from the usual browser cache).
    * When set properly, not only you get a nice user experience with screens loading instantly but you save on your tech cost by have a lot of assets, bundles, pages already distributed (cached at users' ends).
    * This documentation works best after you read and understand PWA and service workers (search on the internet)
