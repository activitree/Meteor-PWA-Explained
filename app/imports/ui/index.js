import { Meteor } from 'meteor/meteor'

// register a service worker when you don't use activitree:push

async function main () {

  // Your usual Meteor Index files


  Meteor.startup(() => {

    // somewhere in the startup ..

    import('./register-sw.js').then(() => {})

    //
  })
}

main()
