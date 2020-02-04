import { Meteor } from 'meteor/meteor'

async function main () {

  // Your usual Meteor Index files


  Meteor.startup(() => {

    // somewhere in the startup ..

    import('./register-sw.js').then(() => {})

    //
  })
}

main()
