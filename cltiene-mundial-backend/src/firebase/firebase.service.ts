import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as serviceAccount from '../../credentials.json';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: admin.firestore.Firestore

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
      })
    }
    this.db = admin.firestore()
  }

  getFirestore() { return this.db }
  getAuth() { return admin.auth() }
}