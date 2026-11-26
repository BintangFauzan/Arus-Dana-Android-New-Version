import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, configured } from './src/services/firebase';
import { getDatabase, listEnvelopes, listTransactions, listTransfers, saveEnvelope, removeEnvelope, saveTransaction, removeTransaction } from './src/db/database';
import { envelopeBalance, sumAmounts } from './src/db/math';
import { createBackup, exportCsv, restoreBackup } from './src/services/export';
import { isAiAllowed, normalizeAccess } from './src/services/access';
import { callAuthenticatedFunction } from './src/services/backend';
import { askProvider, buildChatContext } from './src/services/ai';
import { shouldPromptFeedback } from './src/services/feedback';
import { logEvent } from './src/services/analytics';
import { theme } from './src/theme';

import Header from './src/components/Header';
import Nav from './src/components/Nav';
import SplashScreen from './src/components/SplashScreen';
import OnboardingScreen from './src/components/OnboardingScreen';
import PilihanLoginScreen from './src/components/PilihanLoginScreen';
import LoginScreen from './src/components/LoginScreen';
import DaftarScreen from './src/components/DaftarScreen';
import SetupAmplopScreen from './src/components/SetupAmplopScreen';
import SetupAiKeyScreen from './src/components/SetupAiKeyScreen';
import HomeScreen from './src/components/HomeScreen';
import TransaksiManualScreen from './src/components/TransaksiManualScreen';
import AICaptureScreen from './src/components/AICaptureScreen';
import RiwayatScreen from './src/components/RiwayatScreen';
import ReviewBulananScreen from './src/components/ReviewBulananScreen';
import AksesAIStatusScreen from './src/components/AksesAIStatusScreen';
import SettingsProfilScreen from './src/components/SettingsProfilScreen';
import FeedbackModal from './src/components/FeedbackModal';

const screenNames = ['Splash', 'Onboarding 1/3', 'Onboarding 2/3', 'Onboarding 3/3', 'Pilihan Login', 'Login', 'Daftar Akun', 'Setup Amplop', 'Setup AI Key', 'Home', 'Amplop', 'Transaksi Manual', 'AI Capture', 'Riwayat', 'Review Bulanan', 'Akses AI', 'Settings & Profil'];
function money(value) {
  return `Rp ${Math.round(value || 0).toLocaleString('id-ID')}`;
}
function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [screen, setScreen] = useState(0);
  const [user, setUser] = useState(null);
  const [envelopes, setEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [feedbackPromptEnabled, setFeedbackPromptEnabled] = useState(false);
  const [feedbackInitialDelayDays, setFeedbackInitialDelayDays] = useState(2);
  const [feedbackCooldownHours, setFeedbackCooldownHours] = useState(48);
  const [feedbackPromptVisible, setFeedbackPromptVisible] = useState(false);
  const [feedbackPromptText, setFeedbackPromptText] = useState('');
  const [access, setAccess] = useState({ status: 'inactive', source: 'status_unavailable' });
  const [busy, setBusy] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [transactionKind, setTransactionKind] = useState('expense');
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState('');
  const [form, setForm] = useState({ name: '', budget: '', amount: '', description: '', category: 'Lainnya', date: new Date().toISOString().slice(0, 10), email: '', password: '', confirmPassword: '' });
  const [provider, setProvider] = useState('Gemini');
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const uid = user?.uid || 'dev-local';

  async function refresh() {
    try {
      const dbLocal = await getDatabase(uid);
      const [nextEnvelopes, nextTransactions, nextTransfers] = await Promise.all([listEnvelopes(uid), listTransactions(uid), listTransfers(uid)]);
      setEnvelopes(nextEnvelopes); setTransactions(nextTransactions); setTransfers(nextTransfers);
      return dbLocal;
    } catch (error) {
      setEnvelopes([]); setTransactions([]); setTransfers([]);
      Alert.alert('Data lokal', error.message);
    }
  }
  useEffect(() => {
    if (configured && auth) return onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (current) setScreen(9);
      else setScreen((await AsyncStorage.getItem('arusdana_onboarding_complete')) === 'true' ? 4 : 1);
    });
    setScreen(0);
  }, []);
  useEffect(() => { refresh(); }, [uid]);
  useEffect(() => {
    SecureStore.getItemAsync('arusdana_provider').then((savedProvider) => { if (['Gemini', 'OpenRouter', 'Custom'].includes(savedProvider)) setProvider(savedProvider); }).catch(() => {});
    AsyncStorage.getItem('arusdana_custom_ai_endpoint').then((endpoint) => { if (endpoint) setCustomEndpoint(endpoint); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!user || !db) { setAccess({ status: 'inactive', source: 'status_unavailable' }); return; }
    setAccess({ status: 'inactive', source: 'loading' });
    getDoc(doc(db, 'access', user.uid)).then(async (snapshot) => {
      if (snapshot.exists()) { setAccess(normalizeAccess(snapshot.data())); return; }
      const policy = await getDoc(doc(db, 'config', 'accessPolicy'));
      const defaultStatus = policy.exists() ? policy.data().defaultStatus : null;
      setAccess(defaultStatus === 'unlimited' ? normalizeAccess({ effectiveStatus: 'unlimited', source: 'default_policy' }) : { status: 'inactive', source: 'status_unavailable' });
    }).catch(() => setAccess({ status: 'inactive', source: 'status_unavailable' }));
    getDoc(doc(db, 'config', 'feedbackPrompts')).then((snapshot) => { const settings = snapshot.exists() ? snapshot.data() : {}; setFeedbackPromptEnabled(settings.enabled === true); setFeedbackInitialDelayDays(Number.isInteger(settings.initialDelayDays) ? settings.initialDelayDays : 2); setFeedbackCooldownHours(Number.isInteger(settings.cooldownHours) ? settings.cooldownHours : 48); }).catch(() => setFeedbackPromptEnabled(false));
  }, [user]);
  useEffect(() => {
    let cancelled = false;
    async function checkFeedbackPrompt() {
      if (!user || screen !== 7 || busy || !feedbackPromptEnabled) return;
      const key = `arusdana_feedback_prompt_${user.uid}`;
      const now = Date.now();
      const saved = JSON.parse(await AsyncStorage.getItem(key) || '{}');
      if (saved.neverAsk || cancelled) return;
      if (!saved.firstSeenAt) { await AsyncStorage.setItem(key, JSON.stringify({ ...saved, firstSeenAt: now })); return; }
      if (!shouldPromptFeedback(saved, now, feedbackInitialDelayDays, feedbackCooldownHours)) return;
      if (!cancelled) setFeedbackPromptVisible(true);
    }
    checkFeedbackPrompt().catch(() => {});
    return () => { cancelled = true; };
  }, [user, screen, busy, feedbackPromptEnabled, feedbackInitialDelayDays, feedbackCooldownHours]);
  useEffect(() => {
    if (!Updates.isEnabled) return;
    Updates.checkForUpdateAsync().then(async (result) => {
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert('Pembaruan siap', 'Pembaruan akan diterapkan saat kamu siap.', [{ text: 'Nanti' }, { text: 'Perbarui sekarang', onPress: () => Updates.reloadAsync() }]);
      }
    }).catch((error) => { if (__DEV__) console.warn('Pemeriksaan update tidak berhasil', error); });
  }, []);
  async function login() {
    if (Constants.executionEnvironment === 'storeClient') {
      return Alert.alert('Login diuji melalui APK', 'Google Sign-In native tidak tersedia di Expo Go. Gunakan APK Android yang Founder build melalui EAS untuk menguji login; fitur lain tetap dapat diuji di Expo Go.');
    }
    if (!configured) return Alert.alert('Konfigurasi dibutuhkan', 'Isi variabel EXPO_PUBLIC_FIREBASE_* dari Firebase project Founder.');
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) return Alert.alert('Konfigurasi OAuth dibutuhkan', 'Isi EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dengan Web OAuth Client ID dari Firebase project yang sama.');
    if (!auth) return Alert.alert('Firebase belum siap', 'Periksa konfigurasi Firebase client.');
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId, offlineAccess: false });
      const result = await GoogleSignin.signIn();
      if (result.type !== 'success' || !result.data.idToken) return Alert.alert('Login belum berhasil', 'Google tidak mengembalikan ID token. Periksa google-services.json dan OAuth client Android/Web.');
      const credential = GoogleAuthProvider.credential(result.data.idToken);
      await signInWithCredential(auth, credential);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          displayName: auth.currentUser.displayName || '',
          provider: 'google',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      const { statusCodes } = require('@react-native-google-signin/google-signin');
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Login gagal', error.code === 'auth/network-request-failed' ? 'Login pertama membutuhkan koneksi internet. Coba kembali saat online.' : `${error.message}\n\nPastikan google-services.json milik project arus-dana-mvp tersedia, Google Sign-In aktif, serta package dan SHA-1 EAS terdaftar.`);
    }
  }
  async function loginEmailPassword() {
    if (!configured || !auth) return Alert.alert('Firebase belum siap', 'Periksa konfigurasi Firebase client.');
    if (!form.email.trim() || !form.password) return setLoginError('Email dan password wajib diisi.');
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      setForm({ ...form, email: '', password: '' });
    } catch (error) {
      setLoginError(error.code === 'auth/user-not-found' ? 'Akun tidak ditemukan. Daftar dulu ya.' :
        error.code === 'auth/wrong-password' ? 'Password salah. Coba lagi.' :
        error.code === 'auth/invalid-email' ? 'Format email tidak valid.' :
        error.code === 'auth/too-many-requests' ? 'Terlalu banyak percobaan. Coba lagi nanti.' :
        error.code === 'auth/network-request-failed' ? 'Butuh koneksi internet untuk login.' :
        `Login gagal: ${error.message}`);
    }
  }
  async function registerEmailPassword() {
    if (!configured || !auth) return Alert.alert('Firebase belum siap', 'Periksa konfigurasi Firebase client.');
    if (!form.email.trim() || !form.password || !form.confirmPassword) return setRegisterError('Semua kolom wajib diisi.');
    if (form.password !== form.confirmPassword) return setRegisterError('Password dan konfirmasi tidak cocok.');
    if (form.password.length < 6) return setRegisterError('Password minimal 6 karakter.');
    setRegisterError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await updateProfile(result.user, { displayName: form.email.split('@')[0] });
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: form.email.trim(),
        displayName: form.email.split('@')[0],
        provider: 'email',
        createdAt: serverTimestamp(),
      });
      setForm({ ...form, email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setRegisterError(error.code === 'auth/email-already-in-use' ? 'Email sudah terdaftar. Login aja.' :
        error.code === 'auth/invalid-email' ? 'Format email tidak valid.' :
        error.code === 'auth/weak-password' ? 'Password terlalu lemah (min 6 karakter).' :
        error.code === 'auth/network-request-failed' ? 'Butuh koneksi internet untuk daftar.' :
        `Daftar gagal: ${error.message}`);
    }
  }
  async function resetPassword() {
    if (!configured || !auth) return Alert.alert('Firebase belum siap', 'Periksa konfigurasi Firebase client.');
    if (!form.email.trim()) return setLoginError('Masukkan email dulu.');
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      Alert.alert('Link dikirim', 'Cek email untuk reset password.');
    } catch (error) {
      setLoginError(`Gagal kirim link: ${error.message}`);
    }
  }
  async function transferBetweenEnvelopes() {
    const amount = Number(transferAmount);
    const source = envelopes.find((item) => item.id === transferFrom);
    const target = envelopes.find((item) => item.id === transferTo);
    if (!source || !target || !Number.isSafeInteger(amount) || amount <= 0) return Alert.alert('Periksa transfer', 'Pilih dua amplop dan masukkan nominal rupiah bulat positif.');
    if (envelopeBalance(source, transactions, transfers) < amount) return Alert.alert('Saldo kurang', 'Saldo amplop asal tidak mencukupi.');
    await saveTransfer(uid, { id: makeId(), fromEnvelopeId: source.id, toEnvelopeId: target.id, amount });
    setTransferAmount(''); await refresh(); Alert.alert('Berhasil', 'Saldo berhasil dipindahkan antar-amplop.');
  }
  async function addEnvelope() {
    const budget = Number(form.budget);
    if (!form.name.trim() || !Number.isSafeInteger(budget) || budget < 0) return Alert.alert('Periksa data', 'Nama amplop wajib diisi dan budget harus rupiah bulat.');
    await saveEnvelope(uid, { id: makeId(), name: form.name.trim(), budget, color: theme.colors.primary });
    logEvent('envelope_created');
    setForm({ ...form, name: '', budget: '' }); await refresh(); setScreen(10);
  }
  async function addTransaction() {
    const amount = Number(form.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) return Alert.alert('Nominal tidak valid', 'Masukkan nominal rupiah bulat positif.');
    if (!envelopes.length) return Alert.alert('Belum ada amplop', 'Buat amplop terlebih dahulu.');
    const existing = editingTransactionId ? transactions.find((item) => item.id === editingTransactionId) : null;
    const date = new Date(`${form.date}T12:00:00+07:00`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== form.date) return Alert.alert('Tanggal tidak valid', 'Gunakan format YYYY-MM-DD yang benar.');
    await saveTransaction(uid, { id: editingTransactionId || makeId(), envelopeId: selectedEnvelopeId || existing?.envelopeId || envelopes[0].id, amount, kind: transactionKind, description: form.description, category: form.category, occurredAt: date.toISOString(), createdAt: existing?.createdAt });
    setEditingTransactionId(null); setForm({ ...form, amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); await refresh(); setScreen(9); logEvent('transaction_saved');
  }
  async function ensureAiAccess() {
    let effectiveAccess = access;
    if (access.status !== 'unlimited' && access.status !== 'active' && auth?.currentUser) {
      try {
        const result = await callAuthenticatedFunction(auth, 'startTrialOnFirstAiAccess');
        if (result.started) {
          const snapshot = await getDoc(doc(db, 'access', auth.currentUser.uid));
          if (snapshot.exists()) { effectiveAccess = normalizeAccess(snapshot.data()); setAccess(effectiveAccess); }
        }
      } catch (error) {
        if (__DEV__) console.warn('Status trial belum dapat diperbarui', error);
      }
    }
    return isAiAllowed(effectiveAccess);
  }
  async function captureReceipt(source = 'library') {
    if (!(await ensureAiAccess())) return Alert.alert('Akses AI tidak aktif', 'Fitur budgeting tetap dapat digunakan.');
    const key = apiKey || await SecureStore.getItemAsync('arusdana_ai_key');
    const savedEndpoint = customEndpoint || await AsyncStorage.getItem('arusdana_custom_ai_endpoint');
    if (!key) return setScreen(8);
    logEvent('ai_capture_started', { provider });
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const picked = await picker({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled) return;
    setBusy(true);
    try {
      const compressed = await ImageManipulator.manipulateAsync(picked.assets[0].uri, [{ resize: { width: 1400 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      const parsed = await callVisionProvider(provider, key, compressed.base64, savedEndpoint);
      logEvent('ai_capture_completed', { provider });
      Alert.alert('Hasil AI', `${parsed.description || 'Transaksi'} • ${money(parsed.amount)}\nKonfirmasi untuk menyimpan?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Simpan', onPress: async () => { await saveTransaction(uid, { id: makeId(), envelopeId: envelopes[0]?.id, amount: Math.round(parsed.amount), description: parsed.description || 'Struk', category: parsed.category || 'Lainnya', occurredAt: parsed.date || new Date().toISOString() }); await refresh(); } },
      ]);
    } catch (error) { Alert.alert('AI gagal', error.message); } finally { setBusy(false); }
  }
  async function askAiChat() {
    if (!(await ensureAiAccess())) return Alert.alert('Akses AI tidak aktif', 'Fitur budgeting inti tetap tersedia.');
    const key = apiKey || await SecureStore.getItemAsync('arusdana_ai_key');
    const savedEndpoint = customEndpoint || await AsyncStorage.getItem('arusdana_custom_ai_endpoint');
    if (!key) return setScreen(8);
    setBusy(true);
    try { const context = buildChatContext(transactions, envelopes); setChatAnswer(await askProvider(provider, key, chatQuestion, context, savedEndpoint)); }
    catch (error) { Alert.alert('Chat AI gagal', error.message); }
    finally { setBusy(false); }
  }
  async function saveKey() {
    if (!apiKey.trim()) return Alert.alert('API key kosong', 'Masukkan API key provider.');
    if (provider === 'Custom' && !/^https:\/\//i.test(customEndpoint)) return Alert.alert('Endpoint tidak valid', 'Custom provider harus memakai URL HTTPS.');
    await SecureStore.setItemAsync('arusdana_ai_key', apiKey);
    await AsyncStorage.setItem('arusdana_custom_ai_endpoint', customEndpoint.trim());
    await SecureStore.setItemAsync('arusdana_provider', provider); Alert.alert('Tersimpan', 'Kunci AI disimpan dengan aman di perangkat.'); setScreen(9); }
  async function closeFeedbackPrompt(neverAsk = false) {
    if (user) {
      const key = `arusdana_feedback_prompt_${user.uid}`;
      const saved = JSON.parse(await AsyncStorage.getItem(key) || '{}');
      await AsyncStorage.setItem(key, JSON.stringify({ ...saved, lastPromptAt: Date.now(), neverAsk: neverAsk || saved.neverAsk }));
    }
    setFeedbackPromptVisible(false);
  }
  async function sendFeedback(promptMessage) {
    if (!user || !db) return Alert.alert('Login diperlukan', 'Masuk ke akun untuk mengirim feedback.');
    const message = String(promptMessage ?? form.description).trim();
    const category = form.category.trim();
    if (!message || message.length > 2000) return Alert.alert('Feedback tidak valid', 'Isi feedback wajib diisi dan maksimal 2000 karakter.');
    try { await addDoc(collection(db, 'feedback'), { uid: user.uid, category, message, status: 'new', createdAt: serverTimestamp() }); setForm({ ...form, description: '' }); logEvent('feedback_sent'); if (promptMessage !== undefined) await closeFeedbackPrompt(); Alert.alert('Terima kasih', 'Feedback berhasil dikirim.'); }
    catch (error) { Alert.alert('Belum terkirim', error.message); }
  }
  async function checkUpdate() {
    if (!Updates.isEnabled) return Alert.alert('Update', 'EAS Update tidak tersedia di Expo Go.');
    try { const result = await Updates.checkForUpdateAsync(); if (result.isAvailable) { await Updates.fetchUpdateAsync(); Alert.alert('Update siap', 'Mulai ulang aplikasi untuk menerapkan update.', [{ text: 'Nanti' }, { text: 'Perbarui sekarang', onPress: () => Updates.reloadAsync() }]); } else Alert.alert('Update', 'Aplikasi sudah versi terbaru.'); }
    catch (error) { Alert.alert('Update gagal', error.message); }
  }

  const title = screenNames[screen] || 'Arus Dana';
  const total = sumAmounts(transactions.filter((item) => item.kind === 'income')) - sumAmounts(transactions.filter((item) => item.kind !== 'income'));
  const showLedgerNav = screen >= 9;
  let body;
  if (screen === 0) body = <SplashScreen onMulai={() => setScreen(1)} />;
  else if (screen >= 1 && screen <= 3) body = <OnboardingScreen index={screen} onContinue={() => setScreen(screen === 3 ? 4 : screen + 1)} />;
  else if (screen === 4) body = <PilihanLoginScreen onSudahPunyaAkun={() => setScreen(5)} onBelumPunyaAkun={() => setScreen(6)} />;
  else if (screen === 5) body = <LoginScreen
    email={form.email}
    password={form.password}
    setEmail={(v) => setForm({ ...form, email: v })}
    setPassword={(v) => setForm({ ...form, password: v })}
    loginError={loginError}
    onLogin={loginEmailPassword}
    onGoogle={login}
    onSkip={() => { setUser({ uid: 'dev-local', displayName: 'Mode lokal' }); setScreen(9); }}
    onResetPassword={resetPassword}
    onDaftar={() => setScreen(6)}
    configured={configured}
    envSkipLogin={process.env.EXPO_PUBLIC_DEV_SKIP_LOGIN}
  />;
  else if (screen === 6) body = <DaftarScreen
    email={form.email}
    password={form.password}
    confirmPassword={form.confirmPassword}
    setEmail={(v) => setForm({ ...form, email: v })}
    setPassword={(v) => setForm({ ...form, password: v })}
    setConfirmPassword={(v) => setForm({ ...form, confirmPassword: v })}
    registerError={registerError}
    onRegister={registerEmailPassword}
    onMasuk={() => setScreen(5)}
  />;
  else if (screen === 7 || screen === 10) body = <SetupAmplopScreen
    uid={uid}
    envelopes={envelopes}
    transactions={transactions}
    transfers={transfers}
    envelopeBalance={envelopeBalance}
    money={money}
    transferFrom={transferFrom}
    transferTo={transferTo}
    transferAmount={transferAmount}
    setTransferAmount={setTransferAmount}
    name={form.name}
    budget={form.budget}
    setName={(v) => setForm({ ...form, name: v })}
    setBudget={(v) => setForm({ ...form, budget: v })}
    onSaveEnvelope={addEnvelope}
    onDeleteEnvelope={async (id) => { try { await removeEnvelope(uid, id); await refresh(); } catch (e) { Alert.alert('Gagal menghapus', e.message); } }}
    screen={screen}
    onLewati={() => setScreen(9)}
  />;
  else if (screen === 8) body = <SetupAiKeyScreen
    provider={provider}
    setProvider={setProvider}
    apiKey={apiKey}
    setApiKey={setApiKey}
    customEndpoint={customEndpoint}
    setCustomEndpoint={setCustomEndpoint}
    onSaveKey={saveKey}
    onNanti={() => setScreen(9)}
  />;
  else if (screen === 9) body = <HomeScreen
    uid={uid}
    envelopes={envelopes}
    transactions={transactions}
    transfers={transfers}
    sumAmounts={sumAmounts}
    envelopeBalance={envelopeBalance}
    money={money}
    access={access}
    screen={screen}
    setScreen={setScreen}
  />;
  else if (screen === 11) body = <TransaksiManualScreen
    editingTransactionId={editingTransactionId}
    transactionKind={transactionKind}
    setTransactionKind={setTransactionKind}
    form={form}
    setForm={setForm}
    envelopes={envelopes}
    selectedEnvelopeId={selectedEnvelopeId}
    setSelectedEnvelopeId={setSelectedEnvelopeId}
    onAddTransaction={addTransaction}
    onBatalEdit={() => { setEditingTransactionId(null); setScreen(13); }}
    screen={screen}
  />;
  else if (screen === 12) body = <AICaptureScreen
    busy={busy}
    onCaptureCamera={() => captureReceipt('camera')}
    onCaptureLibrary={() => captureReceipt('library')}
    chatQuestion={chatQuestion}
    setChatQuestion={setChatQuestion}
    onAskAiChat={askAiChat}
    chatAnswer={chatAnswer}
    onAturApiKey={() => setScreen(8)}
  />;
  else if (screen === 13) body = <RiwayatScreen
    historySearch={historySearch}
    setHistorySearch={setHistorySearch}
    transactions={transactions}
    onEdit={(item) => { setEditingTransactionId(item.id); setTransactionKind(item.kind || 'expense'); setSelectedEnvelopeId(item.envelopeId); setForm({ ...form, amount: String(item.amount), description: item.description || '', category: item.category || 'Lainnya', date: item.occurredAt.slice(0, 10) }); setScreen(11); }}
    onDelete={(item) => Alert.alert('Hapus transaksi?', 'Tindakan ini tidak dapat dibatalkan.', [{ text: 'Batal' }, { text: 'Hapus', style: 'destructive', onPress: async () => { await removeTransaction(uid, item.id); refresh(); } }])}
    uid={uid}
  />;
  else if (screen === 14) body = <ReviewBulananScreen transactions={transactions} money={money} />;
  else if (screen === 15) body = <AksesAIStatusScreen access={access} />;
  else if (screen === 16) body = <SettingsProfilScreen
    user={user}
    onSignOut={async () => { if (auth) await signOut(auth); setUser(null); setScreen(5); }}
    onKelolaAmplop={() => setScreen(10)}
    onAturAiKey={() => setScreen(8)}
    onAksesAi={() => setScreen(15)}
    onReviewBulanan={() => setScreen(14)}
    onExportCsv={async () => { try { await exportCsv(transactions); } catch (e) { Alert.alert('Export gagal', e.message); } }}
    onBackupJson={async () => { try { await createBackup(uid); } catch (e) { Alert.alert('Backup gagal', e.message); } }}
    onRestoreBackup={async () => { try { if (await restoreBackup(uid)) await refresh(); } catch (e) { Alert.alert('Restore gagal', e.message); } }}
    onCheckUpdate={checkUpdate}
    category={form.category}
    description={form.description}
    setCategory={(v) => setForm({ ...form, category: v })}
    setDescription={(v) => setForm({ ...form, description: v })}
    onSendFeedback={sendFeedback}
  />;
  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <FeedbackModal
        visible={feedbackPromptVisible}
        feedbackPromptText={feedbackPromptText}
        setFeedbackPromptText={setFeedbackPromptText}
        onKirim={() => sendFeedback(feedbackPromptText)}
        onLewati={() => closeFeedbackPrompt()}
        onJanganTampilkan={() => closeFeedbackPrompt(true)}
      />
      <Header title={title} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
      {showLedgerNav && <Nav screen={screen} onNavigate={setScreen} />}
    </View>
  );
}

async function callVisionProvider(provider, key, base64, customEndpoint) {
  let endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  let headers = { 'Content-Type': 'application/json', 'x-goog-api-key': key };
  let body = { contents: [{ parts: [{ text: 'Baca struk. Jawab JSON valid saja: {"amount": integer rupiah, "description": string, "category": string, "date": ISO date}.' }, { inline_data: { mime_type: 'image/jpeg', data: base64 } }] }] };
  if (provider === 'OpenRouter') { endpoint = 'https://openrouter.ai/api/v1/chat/completions'; headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }; body = { model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: [{ type: 'text', text: 'Baca struk dan jawab JSON {"amount": integer, "description": string, "category": string, "date": ISO date}.' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }] }] }; }
  if (provider === 'Custom') {
    if (!/^https:\/\//i.test(customEndpoint || '')) throw new Error('Endpoint custom wajib URL HTTPS.');
    endpoint = customEndpoint;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    body = { model: 'custom-vision', messages: [{ role: 'user', content: [{ type: 'text', text: 'Baca struk dan jawab JSON valid {"amount": integer rupiah, "description": string, "category": string, "date": ISO date}.' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }] }] };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try { response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal }); }
  catch (error) { if (error.name === 'AbortError') throw new Error('Provider AI melewati batas waktu.'); throw error; }
  finally { clearTimeout(timeout); }
  if (!response.ok) throw new Error(`Provider menolak permintaan (${response.status}). Periksa key atau koneksi.`);
  const json = await response.json();
  const content = provider === 'Gemini' ? json.candidates?.[0]?.content?.parts?.[0]?.text : json.choices?.[0]?.message?.content;
  const parsed = JSON.parse(String(content).replace(/```json|```/g, '').trim());
  if (!Number.isSafeInteger(Number(parsed.amount)) || Number(parsed.amount) <= 0) throw new Error('Respons AI tidak berisi nominal rupiah yang valid.');
  return parsed;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
});