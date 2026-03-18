import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyDU0pm6MTjxjNWuDpNeGT0kfsPxX8JTdak",
  authDomain:        "desarrollo-investigaciones.firebaseapp.com",
  projectId:         "desarrollo-investigaciones",
  storageBucket:     "desarrollo-investigaciones.firebasestorage.app",
  messagingSenderId: "293865702055",
  appId:             "1:293865702055:web:c68f99ac47e943bcacd182",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)