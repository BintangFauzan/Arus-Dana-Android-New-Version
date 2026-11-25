import * as SQLite from 'expo-sqlite';

const databases = new Map();

export async function getDatabase(uid = 'local') {
  const rawUid = String(uid);
  const encodedUid = Array.from(rawUid).map((character) => character.codePointAt(0).toString(16)).join('');
  const safeUid = encodedUid || 'local';
  if (!databases.has(safeUid)) {
    const opening = SQLite.openDatabaseAsync(`arus_dana_${safeUid}.db`).then(async (database) => {
      await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS envelopes (
        id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, budget INTEGER NOT NULL DEFAULT 0,
        color TEXT, createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL, envelopeId TEXT, amount INTEGER NOT NULL,
        kind TEXT NOT NULL DEFAULT 'expense', description TEXT DEFAULT '', category TEXT DEFAULT '',
        occurredAt TEXT NOT NULL, createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY NOT NULL, fromEnvelopeId TEXT NOT NULL, toEnvelopeId TEXT NOT NULL,
        amount INTEGER NOT NULL, occurredAt TEXT NOT NULL
      );
      PRAGMA user_version = 1;
    `);
      return database;
    });
    databases.set(safeUid, opening);
  }
  return databases.get(safeUid);
}

export async function listEnvelopes(uid) {
  const db = await getDatabase(uid);
  return db.getAllAsync('SELECT * FROM envelopes ORDER BY createdAt');
}

export async function removeEnvelope(uid, id) {
  const db = await getDatabase(uid);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions WHERE envelopeId = ?', id);
    await db.runAsync('DELETE FROM transfers WHERE fromEnvelopeId = ? OR toEnvelopeId = ?', id, id);
    await db.runAsync('DELETE FROM envelopes WHERE id = ?', id);
  });
}

export async function saveEnvelope(uid, envelope) {
  if (!envelope.name?.trim() || !Number.isSafeInteger(Number(envelope.budget)) || Number(envelope.budget) < 0) throw new Error('Nama atau budget amplop tidak valid');
  const db = await getDatabase(uid);
  await db.runAsync(
    'INSERT OR REPLACE INTO envelopes (id,name,budget,color,createdAt) VALUES (?,?,?,?,?)',
    envelope.id, envelope.name, Math.round(envelope.budget), envelope.color || null, envelope.createdAt || new Date().toISOString(),
  );
}

export async function listTransactions(uid) {
  const db = await getDatabase(uid);
  return db.getAllAsync('SELECT * FROM transactions ORDER BY occurredAt DESC');
}

export async function saveTransaction(uid, item) {
  if (!['expense', 'income'].includes(item.kind || 'expense')) throw new Error('Jenis transaksi tidak valid');
  if (!Number.isSafeInteger(Number(item.amount)) || Number(item.amount) <= 0) throw new Error('Nominal harus berupa rupiah bulat positif');
  const db = await getDatabase(uid);
  await db.runAsync(
    'INSERT OR REPLACE INTO transactions (id,envelopeId,amount,kind,description,category,occurredAt,createdAt) VALUES (?,?,?,?,?,?,?,?)',
    item.id, item.envelopeId, Math.round(item.amount), item.kind || 'expense', item.description || '', item.category || '', item.occurredAt || new Date().toISOString(), item.createdAt || new Date().toISOString(),
  );
}

export async function removeTransaction(uid, id) {
  const db = await getDatabase(uid);
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function listTransfers(uid) {
  const db = await getDatabase(uid);
  return db.getAllAsync('SELECT * FROM transfers ORDER BY occurredAt DESC');
}

export async function saveTransfer(uid, transfer) {
  if (!Number.isSafeInteger(Number(transfer.amount)) || transfer.amount <= 0 || transfer.fromEnvelopeId === transfer.toEnvelopeId) throw new Error('Data transfer tidak valid');
  const db = await getDatabase(uid);
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO transfers (id,fromEnvelopeId,toEnvelopeId,amount,occurredAt) VALUES (?,?,?,?,?)', transfer.id, transfer.fromEnvelopeId, transfer.toEnvelopeId, Math.round(transfer.amount), transfer.occurredAt || new Date().toISOString());
  });
}
