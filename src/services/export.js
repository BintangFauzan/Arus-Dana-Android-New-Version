import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../db/database';
import { buildBackupPayload, validateBackup } from './backup';

export function makeCsv(rows) {
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return ['Tanggal,Kategori,Amplop,Jenis,Nominal,Keterangan', ...rows.map((r) => [r.occurredAt, r.category, r.envelopeId, r.kind, r.amount, r.description].map(quote).join(','))].join('\n');
}
export async function exportCsv(rows) {
  const uri = `${FileSystem.documentDirectory}arus-dana-transaksi.csv`;
  await FileSystem.writeAsStringAsync(uri, makeCsv(rows));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
  return uri;
}
export async function createBackup(uid) {
  const db = await getDatabase(uid);
  const [envelopes, transactions, transfers] = await Promise.all([
    db.getAllAsync('SELECT * FROM envelopes'),
    db.getAllAsync('SELECT * FROM transactions'),
    db.getAllAsync('SELECT * FROM transfers'),
  ]);
  const backup = buildBackupPayload(envelopes, transactions, transfers);
  const uri = `${FileSystem.documentDirectory}arus-dana-backup.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json' });
  return uri;
}
export async function restoreBackup(uid) {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled) return false;
  let data;
  try { data = validateBackup(JSON.parse(await FileSystem.readAsStringAsync(result.assets[0].uri))); }
  catch (error) { throw new Error(error.message || 'Backup rusak'); }
  const db = await getDatabase(uid);
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM envelopes; DELETE FROM transactions; DELETE FROM transfers;');
    for (const e of data.envelopes) await db.runAsync('INSERT INTO envelopes (id,name,budget,color,createdAt) VALUES (?,?,?,?,?)', e.id, e.name, e.budget, e.color || '#8BD450', e.createdAt || new Date().toISOString());
    for (const t of data.transactions) await db.runAsync('INSERT INTO transactions (id,envelopeId,amount,kind,description,category,occurredAt,createdAt) VALUES (?,?,?,?,?,?,?,?)', t.id, t.envelopeId || null, t.amount, t.kind || 'expense', t.description || '', t.category || '', t.occurredAt || new Date().toISOString(), t.createdAt || new Date().toISOString());
    for (const t of data.transfers) await db.runAsync('INSERT INTO transfers (id,fromEnvelopeId,toEnvelopeId,amount,occurredAt) VALUES (?,?,?,?,?)', t.id, t.fromEnvelopeId, t.toEnvelopeId, t.amount, t.occurredAt || new Date().toISOString());
  });
  return true;
}
