# Meteor Demo PWA
Demonstrate the use of PWA with Workbox 5 in a Meteor 1.9+ Project

<a href="https://www.repostatus.org/#active"><img src="https://www.repostatus.org/badges/latest/active.svg" alt="Project Status: Active – The project has reached a stable, usable state and is being actively developed." /></a>

**This is running in production with https://www.activitree.com**

<img alt="Activitree" src="https://assets.activitree.com/images/ad_banner.jpg" width="100%">



* This is based on https://github.com/timothyarmes/ta-meteor-apollo-starter-kit 2 and most of the comments in the swSrc.js file belong to the original creator.
* swSrc.js contains a demo for Push Notifications which has been tested with activitree:push. This part needs adaptation for anyone’s needs/flow.
* Procedure: you update the swSrc.js file and then run the scrip in the package.json. That script updates the sw.js in the public folder. Do not edit sw.js directly.
* From the comments in swSrc.js you should understand what are the Meteor particularities. At the existent configuration you will probably want to add the bits for the 200 response (we are planning to do this in this repo soon), probably an extra route with an offline condition (the helper is provided by Workbox).
* You can get Workbox by adding it as an NPM to you project bundle or the way is presented in this repo (by importing the script from CDN). I didn’t want to load this in the JS bundle so I prefer to use import script.
* There are very useful options to catch any kind of files, with expiration dates etc. Please read the Workbox 5 documentation (https://developers.google.com/web/tools/workbox)
* This configuration should already satisfy the swapping of JS and CSS bundle files when new hashes are found.
* We have this in production with the 'under-construction' project in case you want to give it a try/check. (https://www.activitree.com)
