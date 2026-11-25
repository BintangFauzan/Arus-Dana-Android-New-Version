const fs = require('fs');
const projectId = process.env.EAS_PROJECT_ID || undefined;
const googleServicesFile = fs.existsSync('./google-services.json') ? './google-services.json' : undefined;

module.exports = ({ config }) => ({
  ...config,
  name: 'Arus Dana',
  slug: 'arus-dana-mobile',
  scheme: 'arusdana',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  android: {
    ...config.android,
    package: 'com.bintangfauzandyan.arusdana',
    allowBackup: false,
    permissions: ['CAMERA'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  plugins: [
    'expo-sqlite',
    'expo-asset',
    'expo-secure-store',
    ['expo-camera', { cameraPermission: 'Izinkan Arus Dana mengambil foto struk.', microphonePermission: false }],
    ['expo-image-picker', { photosPermission: 'Izinkan Arus Dana memilih foto struk.' }],
    'expo-updates',
    'expo-sharing',
    'expo-web-browser',
    ['@react-native-firebase/app', googleServicesFile ? { androidGoogleServicesFile: googleServicesFile } : {}],
  ],
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    enabled: Boolean(projectId),
    ...(projectId ? { url: `https://u.expo.dev/${projectId}` } : {}),
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  extra: {
    eas: { projectId },
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    },
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  },
});
