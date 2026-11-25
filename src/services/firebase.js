import { initializeApp, getApps } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const config = Constants.expoConfig?.extra?.firebase || {};
const configured = Boolean(config.apiKey && config.projectId && config.appId);
let app;
let auth;
let db;
if (configured) {
  app = getApps().length ? getApps()[0] : initializeApp(config);
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app);
  }
  db = getFirestore(app);
}
export { app, auth, db, configured };
