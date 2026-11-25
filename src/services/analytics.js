import Constants from 'expo-constants';

let nativeAnalytics;
const runningInExpoGo = Constants.executionEnvironment === 'storeClient';
if (!runningInExpoGo) {
  try {
    // Firebase Analytics native hanya tersedia pada build EAS, bukan Expo Go.
    nativeAnalytics = require('@react-native-firebase/analytics').default;
  } catch {
    nativeAnalytics = null;
  }
}

const ALLOWED_EVENTS = new Set(['app_open', 'onboarding_complete', 'login_success', 'envelope_created', 'transaction_saved', 'ai_capture_started', 'ai_capture_completed', 'feedback_sent', 'backup_created', 'export_created']);
export async function logEvent(name, parameters = {}) {
  if (!ALLOWED_EVENTS.has(name)) return;
  const safeParams = Object.fromEntries(Object.entries(parameters).filter(([key, value]) => ['screen', 'provider', 'result'].includes(key) && typeof value === 'string' && value.length <= 40));
  if (__DEV__) console.log('[analytics]', name, safeParams);
  if (nativeAnalytics) {
    try { await nativeAnalytics().logEvent(name, safeParams); } catch (_error) { if (__DEV__) console.warn('Analytics unavailable', _error); }
  }
}
