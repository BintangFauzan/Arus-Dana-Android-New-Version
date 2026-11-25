import { envelopeBalance, monthlyDelta, transferBalances } from '../src/db/math';
import { isAiAllowed, normalizeAccess, parseJakartaDate } from '../src/services/access';
import { makeCsv } from '../src/services/export';
import { buildBackupPayload, validateBackup } from '../src/services/backup';
import { shouldPromptFeedback } from '../src/services/feedback';

describe('perhitungan rupiah integer', () => {
  test('menghitung sisa amplop dengan pemasukan dan pengeluaran', () => {
    expect(envelopeBalance({ id: 'makan', budget: 500000 }, [
      { envelopeId: 'makan', amount: 120000, kind: 'expense' },
      { envelopeId: 'makan', amount: 20000, kind: 'income' },
    ], [{ fromEnvelopeId: 'makan', toEnvelopeId: 'darurat', amount: 30000 }])).toBe(370000);
  });
  test('delta bulanan dan transfer tidak memakai pecahan uang', () => {
    expect(monthlyDelta([{ amount: 150 }], [{ amount: 100 }])).toBe(50);
    expect(transferBalances({ balance: 700, id: 'a' }, { balance: 200, id: 'b' }, 250)).toEqual({ fromBalance: 450, toBalance: 450 });
    expect(() => transferBalances({ balance: 10 }, { balance: 0 }, 0)).toThrow();
  });
});

describe('akses dan tanggal', () => {
  test('status server yang tidak ada atau tidak dikenal tidak memberi akses AI', () => {
    expect(normalizeAccess(null).status).toBe('inactive');
    expect(normalizeAccess({ effectiveStatus: 'unexpected' }).status).toBe('inactive');
    expect(normalizeAccess({ effectiveStatus: 'date_limited_free', endAtExclusive: new Date('2026-01-03T17:00:00.000Z') }).endsAt.toISOString()).toBe('2026-01-03T16:59:59.999Z');
    expect(isAiAllowed({ status: 'inactive' })).toBe(false);
  });
  test('tanggal Jakarta menolak tanggal kalender tidak valid', () => {
    expect(parseJakartaDate('2026-11-30')).toBeInstanceOf(Date);
    expect(parseJakartaDate('2026-11-31')).toBeNull();
  });
});

test('backup round-trip mempertahankan data ledger dan menolak data rusak', () => {
  const envelopes = [{ id: 'e', name: 'Makan', budget: 10, createdAt: 'today' }, { id: 'z', name: 'Lainnya', budget: 0, createdAt: 'today' }];
  const transactions = [{ id: 't', amount: 10, occurredAt: 'today' }];
  const transfers = [{ id: 'x', fromEnvelopeId: 'e', toEnvelopeId: 'z', amount: 5 }];
  const backup = buildBackupPayload(envelopes, transactions, transfers, 'stamp');
  expect(validateBackup(JSON.parse(JSON.stringify(backup)))).toEqual(backup);
  expect(() => validateBackup({ ...backup, transactions: [{ id: 't', amount: 0, occurredAt: '' }] })).toThrow();
  expect(() => validateBackup({ ...backup, schemaVersion: 2 })).toThrow();
});

test('feedback hanya muncul setelah delay dan menghormati cooldown', () => {
  const day = 24 * 60 * 60 * 1000;
  expect(shouldPromptFeedback({ firstSeenAt: 1000 }, 1000 + day, 2, 48)).toBe(false);
  expect(shouldPromptFeedback({ firstSeenAt: 1000 }, 1000 + 3 * day, 2, 48)).toBe(true);
  expect(shouldPromptFeedback({ firstSeenAt: 1000, lastPromptAt: 1000 + 2 * day }, 1000 + 3 * day, 2, 48)).toBe(false);
  expect(shouldPromptFeedback({ firstSeenAt: 1000, neverAsk: true }, 1000 + 10 * day)).toBe(false);
});

test('CSV escape tanda kutip', () => {
  expect(makeCsv([{ occurredAt: '2026-01-01', category: 'Lainnya', envelopeId: 'a', kind: 'expense', amount: 5, description: 'te"s' }])).toContain('"te""s"');
});
