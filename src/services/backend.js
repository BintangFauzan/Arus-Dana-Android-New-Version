import { getIdToken } from 'firebase/auth';
import Constants from 'expo-constants';

const functionsBaseUrl = Constants.expoConfig?.extra?.firebaseFunctionsUrl || process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_URL || '';

export async function callAuthenticatedFunction(auth, name, data = {}) {
  if (!functionsBaseUrl) throw new Error('URL Cloud Functions belum dikonfigurasi.');
  const token = await getIdToken(auth.currentUser, true);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${functionsBaseUrl}/${name}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: controller.signal,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || body.message || `Backend menolak permintaan (${response.status})`);
    return body;
  } finally { clearTimeout(timeout); }
}
