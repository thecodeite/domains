import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

export const firebaseConfig = {
  apiKey: 'AIzaSyCfvbzhyHIjbZ39qrR0eT0dGVtkI7oYgZE',
  authDomain: 'domains-3b71b.firebaseapp.com',
  databaseURL: 'https://domains-3b71b.firebaseio.com',
  projectId: 'domains-3b71b',
  storageBucket: 'domains-3b71b.appspot.com',
  messagingSenderId: '578838819466',
  appId: '1:578838819466:web:65da0b278fdfc9b1f87373',
}

export const firebaseApp = firebase.initializeApp(firebaseConfig)
export const db = firebase.firestore()
