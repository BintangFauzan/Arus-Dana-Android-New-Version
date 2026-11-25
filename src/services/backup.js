export function buildBackupPayload(envelopes, transactions, transfers, exportedAt = new Date().toISOString()) {
  return { schemaVersion: 1, exportedAt, envelopes: [...envelopes], transactions: [...transactions], transfers: [...transfers] };
}

export function validateBackup(data) {
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.envelopes) || !Array.isArray(data.transactions) || !Array.isArray(data.transfers)) {
    throw new Error('Format backup tidak didukung atau rusak');
  }
  const envelopeIds = new Set();
  for (const envelope of data.envelopes) {
    if (!envelope || typeof envelope.id !== 'string' || !envelope.id || envelopeIds.has(envelope.id) || typeof envelope.name !== 'string' || !Number.isSafeInteger(envelope.budget) || envelope.budget < 0 || (envelope.createdAt !== undefined && typeof envelope.createdAt !== 'string')) {
      throw new Error('Data amplop pada backup tidak valid');
    }
    envelopeIds.add(envelope.id);
  }
  const transactionIds = new Set();
  for (const item of data.transactions) {
    if (!item || typeof item.id !== 'string' || !item.id || transactionIds.has(item.id) || !Number.isSafeInteger(item.amount) || item.amount <= 0 || (item.occurredAt !== undefined && typeof item.occurredAt !== 'string') || (item.envelopeId && !envelopeIds.has(item.envelopeId))) {
      throw new Error('Data transaksi pada backup tidak valid');
    }
    transactionIds.add(item.id);
  }
  const transferIds = new Set();
  for (const item of data.transfers) {
    if (!item || typeof item.id !== 'string' || !item.id || transferIds.has(item.id) || typeof item.fromEnvelopeId !== 'string' || typeof item.toEnvelopeId !== 'string' || !envelopeIds.has(item.fromEnvelopeId) || !envelopeIds.has(item.toEnvelopeId) || item.fromEnvelopeId === item.toEnvelopeId || !Number.isSafeInteger(item.amount) || item.amount <= 0 || (item.occurredAt !== undefined && typeof item.occurredAt !== 'string')) {
      throw new Error('Data transfer pada backup tidak valid');
    }
    transferIds.add(item.id);
  }
  return data;
}
