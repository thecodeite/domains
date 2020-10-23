import React from 'react'
import withFirebaseAuth, {
  WrappedComponentProps,
} from 'react-with-firebase-auth'
import * as firebase from 'firebase/app'

import { firebaseApp } from './firebaseApp'
import { ListDomains } from './ListDomains'
import { UserContext } from './UserContext'
import './App.css'

const firebaseAppAuth = firebaseApp.auth()
const providers = {
  googleProvider: new firebase.auth.GoogleAuthProvider(),
}

function App({ user, signOut, signInWithGoogle }: WrappedComponentProps) {
  return (
    <UserContext.Provider value={user}>
      <div className="App">
        <header className="App-header">
          {user ? (
            <span>Hello, {user.displayName} </span>
          ) : (
            <span>Please sign in. </span>
          )}
          {user ? (
            <button onClick={signOut}>Sign out</button>
          ) : (
            <button onClick={signInWithGoogle}>Sign in with Google</button>
          )}
        </header>
        <ListDomains />
      </div>
    </UserContext.Provider>
  )
}

export default withFirebaseAuth({
  providers,
  firebaseAppAuth,
})(App)
