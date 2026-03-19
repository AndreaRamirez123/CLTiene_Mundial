import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as serviceAccount from '../../credentials.json';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
      });
    }
  }

  getAuth() {
    return admin.auth();
  }

  getMessaging() {
    return admin.messaging();
  }
}
