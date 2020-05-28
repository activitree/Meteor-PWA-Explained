This handling of the offline experience in Meteor may look a bit hacky and we'd love to see a better concept if you find one.
This is based on listening to the response when fetching a file from the Meteor server. The problem here is that I want to direct to the offline page if I cannot provide the page I am supposed to display. That would be plain easy for something like Wordpress which redirects to a new page for almost every click. However we are here in an SPA (single page app) with reactive data and many times, although I am routing to a new ... route, from the browser perspecive I am in the same page.

For a non-SPA website, it would be easy to route to a page and if returned a 404 or 50* would redirect to the offline page. However this is not our case. What we did here looks like the following. We placed an empty text file in the public folder and we try to fetch it with every call on a new route.

Perhaps this could make more sense when you look in your Chrome inspector and observe the traffic and responses.

**fragment from the service worker**
```javascript
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
```

**in app.js or the file where you keep your header, main app (routing), footer logic**

```javascript
// history here can be your browser history and you will listen to changes in URL.
//... other imports 
import { HTTP } from 'meteor/http'

 history.listen((location, action) => {
            // In the same place we update our google analytics.
            ReactGA.set({ page: location.pathname })
            ReactGA.pageview(location.pathname)

            // We fetch the empty text file from the Meteor server with every change in URL.
            HTTP.call('GET', `${Meteor.absoluteUrl('a.txt')}`, {}, (err, res) => {
              if (err) { console.log('Error here: ', err) } else {
                // I use a file 'a.txt' in order to intercept a header present for every route change.
                // With this I show a disconnected page on router change. My service worker can show a offline page only on a reload/refresh of page.
                if (!res.headers?.live) { window.location.reload() }
              }
            })
          })


