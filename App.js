import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, configured } from './src/services/firebase';
import { getDatabase, listEnvelopes, listTransactions, listTransfers, saveEnvelope, removeEnvelope, saveTransaction, saveTransfer, removeTransaction } from './src/db/database';
import { envelopeBalance, sumAmounts } from './src/db/math';
import { createBackup, exportCsv, restoreBackup } from './src/services/export';
import { isAiAllowed, normalizeAccess } from './src/services/access';
import { callAuthenticatedFunction } from './src/services/backend';
import { askProvider, buildChatContext } from './src/services/ai';
import { shouldPromptFeedback } from './src/services/feedback';
import { logEvent } from './src/services/analytics';
import { theme } from './src/theme';

const screenNames = ['Splash', 'Onboarding 1/3', 'Onboarding 2/3', 'Onboarding 3/3', 'Login', 'Setup Amplop', 'Setup AI Key', 'Home', 'Amplop', 'Transaksi Manual', 'AI Capture', 'Riwayat', 'Review Bulanan', 'Akses AI', 'Settings & Profil'];
const money = (value) => `Rp ${Math.round(value || 0).toLocaleString('id-ID')}`;
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const [form, setForm] = useState({ name: '', budget: '', amount: '', description: '', category: 'Lainnya', date: new Date().toISOString().slice(0, 10) });
  const [provider, setProvider] = useState('Gemini');
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
      if (current) setScreen(7);
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
    } catch (error) {
      const { statusCodes } = require('@react-native-google-signin/google-signin');
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Login gagal', error.code === 'auth/network-request-failed' ? 'Login pertama membutuhkan koneksi internet. Coba kembali saat online.' : `${error.message}\n\nPastikan google-services.json milik project arus-dana-mvp tersedia, Google Sign-In aktif, serta package dan SHA-1 EAS terdaftar.`);
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
    setForm({ ...form, name: '', budget: '' }); await refresh(); setScreen(8);
  }
  async function addTransaction() {
    const amount = Number(form.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) return Alert.alert('Nominal tidak valid', 'Masukkan nominal rupiah bulat positif.');
    if (!envelopes.length) return Alert.alert('Belum ada amplop', 'Buat amplop terlebih dahulu.');
    const existing = editingTransactionId ? transactions.find((item) => item.id === editingTransactionId) : null;
    const date = new Date(`${form.date}T12:00:00+07:00`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== form.date) return Alert.alert('Tanggal tidak valid', 'Gunakan format YYYY-MM-DD yang benar.');
    await saveTransaction(uid, { id: editingTransactionId || makeId(), envelopeId: selectedEnvelopeId || existing?.envelopeId || envelopes[0].id, amount, kind: transactionKind, description: form.description, category: form.category, occurredAt: date.toISOString(), createdAt: existing?.createdAt });
    setEditingTransactionId(null); setForm({ ...form, amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); await refresh(); setScreen(7); logEvent('transaction_saved');
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
    if (!key) return setScreen(6);
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
    if (!key) return setScreen(6);
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
    await SecureStore.setItemAsync('arusdana_provider', provider); Alert.alert('Tersimpan', 'Kunci AI disimpan dengan aman di perangkat.'); setScreen(7); }
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
  const input = (label, key, options = {}) => <TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor={theme.colors.muted} value={form[key]} onChangeText={(value) => setForm({ ...form, [key]: value })} keyboardType={options.numeric ? 'number-pad' : 'default'} style={styles.input} />;
  const button = (label, onPress, secondary = false) => <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.button, secondary && styles.secondary]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></TouchableOpacity>;
  const card = (child) => <View style={styles.card}>{child}</View>;
  const nav = () => <View style={styles.nav}>{[['Home', 7], ['Amplop', 8], ['Riwayat', 11], ['Settings', 14]].map(([label, index]) => <TouchableOpacity key={label} onPress={() => setScreen(index)} style={styles.navItem}><Text style={{ color: screen === index ? theme.colors.primary : theme.colors.muted }}>{label}</Text></TouchableOpacity>)}</View>;
  const showLedgerNav = screen >= 7;
  let body;
  if (screen === 0) body = <>{card(<><Text style={styles.hero}>ARUS DANA</Text><Text style={styles.muted}>Anggaran lebih tenang, setiap hari.</Text></>)}{button('Mulai', () => setScreen(1))}</>;
  else if (screen >= 1 && screen <= 3) body = <>{card(<><Text style={styles.hero}>{['Catat tanpa ribet', 'Atur uang per amplop', 'Semua tetap milikmu'][screen - 1]}</Text><Text style={styles.muted}>Data keuangan tersimpan lokal di perangkat. Buat keputusan lebih baik dengan Arus Dana.</Text></>)}{screen === 3 && card(<Text style={styles.warning}>Penting: uninstall aplikasi atau ganti HP dapat menghapus ledger. Gunakan Export CSV atau Backup di Settings.</Text>)}{button(screen === 3 ? 'Lanjut ke Login' : 'Lanjut', async () => { if (screen === 3) await AsyncStorage.setItem('arusdana_onboarding_complete', 'true'); setScreen(screen === 3 ? 4 : screen + 1); })}</>;
  else if (screen === 4) body = <>{card(<><Text style={styles.heading}>Masuk ke Arus Dana</Text><Text style={styles.muted}>Login Google diperlukan sebelum memakai aplikasi. Setelah login pertama, ledger dapat digunakan offline di perangkat ini.</Text></>)}{button('Lanjutkan dengan Google', login)}{!configured && __DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_LOGIN === 'true' && button('Mode lokal untuk uji', () => { setUser({ uid: 'dev-local', displayName: 'Mode lokal' }); setScreen(7); }, true)}</>;
  else if (screen === 5 || screen === 8) body = <>{card(<><Text style={styles.heading}>Buat amplop</Text>{input('Nama amplop', 'name')}{input('Budget rupiah', 'budget', { numeric: true })}</>)}{button('Simpan amplop', addEnvelope)}{screen === 8 && envelopes.map((envelope) => card(<><Text style={styles.heading}>{envelope.name}</Text><Text style={styles.muted}>Budget {money(envelope.budget)} · Sisa {money(envelopeBalance(envelope, transactions, transfers))}</Text>{button('Hapus amplop', () => Alert.alert('Hapus amplop?', 'Transaksi terkait serta transfer masuk dan keluar dari amplop ini akan ikut dihapus.', [{ text: 'Batal' }, { text: 'Hapus', style: 'destructive', onPress: async () => { try { await removeEnvelope(uid, envelope.id); await refresh(); } catch (error) { Alert.alert('Gagal menghapus', error.message); } } }]), true)}</>))}{screen === 8 && card(<><Text style={styles.heading}>Transfer antar-amplop</Text>{envelopes.map((envelope) => <View key={envelope.id}>{button(`Dari: ${transferFrom === envelope.id ? '✓ ' : ''}${envelope.name}`, () => setTransferFrom(envelope.id), true)}{button(`Ke: ${transferTo === envelope.id ? '✓ ' : ''}${envelope.name}`, () => setTransferTo(envelope.id), true)}</View>)}<TextInput accessibilityLabel="Nominal transfer" placeholder="Nominal rupiah" placeholderTextColor={theme.colors.muted} keyboardType="number-pad" value={transferAmount} onChangeText={setTransferAmount} style={styles.input} />{button('Pindahkan saldo', transferBetweenEnvelopes)}</>)}{screen === 5 && button('Lewati dulu', () => setScreen(6), true)}</>;
  else if (screen === 6) body = <>{card(<><Text style={styles.heading}>Kunci AI (opsional)</Text><Text style={styles.muted}>Kunci disimpan hanya di SecureStore. Foto dan pertanyaan dikirim langsung ke provider yang kamu pilih.</Text><Text style={styles.label}>Provider</Text>{['Gemini', 'OpenRouter', 'Custom'].map((name) => button(`${provider === name ? '✓ ' : ''}${name}`, () => setProvider(name), true))}{provider === 'Custom' && <TextInput accessibilityLabel="Endpoint provider" placeholder="Endpoint HTTPS OpenAI-compatible" placeholderTextColor={theme.colors.muted} value={customEndpoint} onChangeText={setCustomEndpoint} style={styles.input} />}{input('API key', 'unused') }<TextInput placeholder="Tempel API key" placeholderTextColor={theme.colors.muted} secureTextEntry value={apiKey} onChangeText={setApiKey} style={styles.input} /></>)}{button('Simpan key', saveKey)}{button('Nanti saja', () => setScreen(7), true)}</>;
  else if (screen === 7) body = <>{card(<><Text style={styles.muted}>SALDO TERSEDIA</Text><Text style={styles.hero}>{money(total)}</Text><Text style={styles.muted}>Akses AI: {access.status === 'unlimited' ? 'Early Access · tanpa batas waktu' : access.status}</Text></>)}{button('＋ Catat transaksi', () => setScreen(9))}{button('Scan struk dengan AI', () => setScreen(10), true)}<Text style={styles.section}>Amplop</Text>{envelopes.length ? envelopes.slice(0, 4).map((e) => card(<><Text style={styles.heading}>{e.name}</Text><Text style={styles.muted}>{money(envelopeBalance(e, transactions, transfers))} tersisa dari {money(e.budget)}</Text><View style={styles.progress}><View style={{ backgroundColor: theme.colors.primary, width: `${Math.max(0, Math.min(100, e.budget ? envelopeBalance(e, transactions, transfers) / e.budget * 100 : 0))}%`, height: 3 }} /></View></>)) : card(<>{<Text style={styles.muted}>Belum ada amplop. Mulai dengan membuat amplop pertamamu.</Text>}{button('Buat amplop', () => setScreen(5))}</>)}</>;
  else if (screen === 9) body = <>{card(<><Text style={styles.heading}>{editingTransactionId ? 'Edit transaksi' : 'Transaksi baru'}</Text>{button(transactionKind === 'expense' ? 'Pengeluaran dipilih' : 'Jenis: Pengeluaran', () => setTransactionKind('expense'), true)}{button(transactionKind === 'income' ? 'Pemasukan dipilih' : 'Jenis: Pemasukan', () => setTransactionKind('income'), true)}{input('Nominal rupiah', 'amount', { numeric: true })}{input('Keterangan', 'description')}{input('Kategori', 'category')}{input('Tanggal (YYYY-MM-DD)', 'date')}{envelopes.map((envelope) => button(`${selectedEnvelopeId === envelope.id ? '✓ ' : ''}${envelope.name}`, () => setSelectedEnvelopeId(envelope.id), true))}</>)}{button(editingTransactionId ? 'Simpan perubahan' : 'Simpan transaksi', addTransaction)}{editingTransactionId && button('Batal edit', () => { setEditingTransactionId(null); setScreen(11); }, true)}</>;
  else if (screen === 10) body = <>{card(<><Text style={styles.heading}>AI Capture</Text><Text style={styles.muted}>{busy ? 'Memproses foto…' : 'Foto dikompres sebelum dikirim langsung ke provider BYOK.'}</Text></>)}{button('Ambil foto struk', () => captureReceipt('camera'))}{button('Pilih dari galeri', () => captureReceipt('library'), true)}{card(<><Text style={styles.heading}>Tanya AI</Text><TextInput accessibilityLabel="Pertanyaan AI" placeholder="Contoh: bagaimana mengatur pengeluaran?" placeholderTextColor={theme.colors.muted} value={chatQuestion} onChangeText={setChatQuestion} style={styles.input} multiline />{button(busy ? 'Memproses…' : 'Kirim pertanyaan', askAiChat)}{chatAnswer ? <Text style={styles.muted}>{chatAnswer}</Text> : null}</>)}{button('Atur API key', () => setScreen(6), true)}</>;
  else if (screen === 11) body = <><TextInput accessibilityLabel="Cari transaksi" placeholder="Cari transaksi" placeholderTextColor={theme.colors.muted} value={historySearch} onChangeText={setHistorySearch} style={styles.input} />{transactions.length ? transactions.filter((item) => `${item.description} ${item.category} ${item.amount}`.toLowerCase().includes(historySearch.toLowerCase())).map((item) => card(<><Text style={styles.heading}>{item.description || item.category || 'Transaksi'}</Text><Text style={styles.muted}>{new Date(item.occurredAt).toLocaleString('id-ID')} · {item.category}</Text><Text style={[styles.heading, { color: item.kind === 'income' ? theme.colors.primary : theme.colors.text }]}>{item.kind === 'income' ? '+' : '−'}{money(item.amount)}</Text>{button('Edit', () => { setEditingTransactionId(item.id); setTransactionKind(item.kind || 'expense'); setSelectedEnvelopeId(item.envelopeId); setForm({ ...form, amount: String(item.amount), description: item.description || '', category: item.category || 'Lainnya', date: item.occurredAt.slice(0, 10) }); setScreen(9); }, true)}{button('Hapus', () => Alert.alert('Hapus transaksi?', 'Tindakan ini tidak dapat dibatalkan.', [{ text: 'Batal' }, { text: 'Hapus', style: 'destructive', onPress: async () => { await removeTransaction(uid, item.id); refresh(); } }]), true)}</>)) : card(<Text style={styles.muted}>Belum ada transaksi.</Text>)}</>;
  else if (screen === 12) body = <>{card(<><Text style={styles.heading}>Ringkasan bulan ini</Text><Text style={styles.muted}>Pemasukan {money(sumAmounts(transactions.filter((t) => t.kind === 'income')))}</Text><Text style={styles.muted}>Pengeluaran {money(sumAmounts(transactions.filter((t) => t.kind !== 'income')))}</Text><Text style={styles.muted}>Data ini hanya diproses pada perangkat.</Text></>)}</>;
  else if (screen === 13) body = <>{card(<><Text style={styles.heading}>Akses AI</Text><Text style={styles.hero}>{access.status === 'unlimited' ? 'Unlimited' : access.status === 'inactive' ? 'Terkunci' : access.status}</Text><Text style={styles.muted}>{access.endsAt ? `Berakhir: ${access.endsAt.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' })} WIB` : access.status === 'unlimited' ? 'Early Access tanpa batas waktu.' : 'Tanggal berakhir tidak tersedia dari server.'}</Text><Text style={styles.muted}>Fitur inti budgeting tetap tersedia.</Text></>)}</>;
  else body = <>{card(<><Text style={styles.heading}>Profil & Pengaturan</Text><Text style={styles.muted}>{user?.displayName || 'Pengguna'}{user?.email ? ` · ${user.email}` : ''}</Text>{button('Keluar', async () => { if (auth) await signOut(auth); setUser(null); setScreen(4); }, true)}</>)}{button('Kelola amplop', () => setScreen(8), true)}{button('Atur AI Key', () => setScreen(6), true)}{button('Akses AI', () => setScreen(13), true)}{button('Review bulanan', () => setScreen(12), true)}{button('Export CSV', async () => { try { await exportCsv(transactions); } catch (e) { Alert.alert('Export gagal', e.message); } }, true)}{button('Backup JSON', async () => { try { await createBackup(uid); } catch (e) { Alert.alert('Backup gagal', e.message); } }, true)}{button('Restore backup', async () => { try { if (await restoreBackup(uid)) await refresh(); } catch (e) { Alert.alert('Restore gagal', e.message); } }, true)}{button('Periksa pembaruan', checkUpdate, true)}{card(<>{input('Kategori feedback', 'category')}{input('Tulis masukan atau kendala', 'description')}</>)}{button('Kirim feedback', sendFeedback, true)}{card(<Text style={styles.warning}>Ledger hanya tersimpan di perangkat ini. Uninstall atau ganti HP dapat menghilangkan data; buat backup berkala.</Text>)}</>;
  return <View style={styles.app}><StatusBar barStyle="light-content" backgroundColor={theme.colors.background} /><Modal visible={feedbackPromptVisible} transparent animationType="fade" onRequestClose={() => closeFeedbackPrompt()}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.heading}>Bagaimana pengalamanmu?</Text><Text style={styles.muted}>Masukan dikirim hanya saat kamu menekan tombol kirim.</Text><TextInput accessibilityLabel="Feedback berkala" placeholder="Tulis saran singkat" placeholderTextColor={theme.colors.muted} value={feedbackPromptText} onChangeText={setFeedbackPromptText} style={styles.input} multiline />{button('Kirim feedback', () => sendFeedback(feedbackPromptText))}{button('Lewati', () => closeFeedbackPrompt(), true)}{button('Jangan tampilkan lagi', () => closeFeedbackPrompt(true), true)}</View></View></Modal><View style={styles.top}><Text style={styles.brand}>ARUS DANA</Text><Text style={styles.title}>{title}</Text></View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{body}</ScrollView>{showLedgerNav && nav()}</View>;
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
  app: { flex: 1, backgroundColor: theme.colors.background }, top: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }, brand: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 }, title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginTop: 8 }, content: { padding: 20, paddingBottom: 32, gap: 12 }, card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 }, hero: { fontSize: 30, lineHeight: 38, color: theme.colors.text, fontWeight: '800' }, heading: { fontSize: 18, color: theme.colors.text, fontWeight: '700' }, muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 }, label: { color: theme.colors.muted }, warning: { color: theme.colors.primary, lineHeight: 21 }, input: { backgroundColor: '#292929', borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8, color: theme.colors.text, minHeight: 50, paddingHorizontal: 14 }, button: { backgroundColor: theme.colors.primary, borderRadius: 8, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginVertical: 3 }, buttonText: { color: '#121212', fontWeight: '700', fontSize: 15 }, secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }, secondaryText: { color: theme.colors.text }, section: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 14 }, progress: { height: 3, backgroundColor: '#3A3A3A', marginTop: 8 }, modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.75)' }, modalCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, gap: 10 }, nav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingVertical: 13, paddingBottom: 20, justifyContent: 'space-around' }, navItem: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
});
