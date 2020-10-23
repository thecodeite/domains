import React from 'react'
import * as firebase from 'firebase/app'

export const UserContext = React.createContext<
  firebase.User | null | undefined
>(undefined)
