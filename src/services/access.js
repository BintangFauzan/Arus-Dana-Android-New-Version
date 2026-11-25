export const ACCESS = Object.freeze({ UNLIMITED: 'unlimited', ACTIVE: 'active', DATED: 'date_limited_free', TRIAL: 'free_tier', INACTIVE: 'inactive' });

// Status yang belum berhasil dibaca server tidak memberi hak AI.
export function normalizeAccess(document) {
  if (!document) return { status: ACCESS.INACTIVE, source: 'status_unavailable', endsAt: null };
  const status = document.effectiveStatus;
  if (Object.values(ACCESS).includes(status)) {
    const rawEnd = document.trialEndsAt || document.accessEndsAt || document.endAtExclusive || null;
    const parsedEnd = rawEnd?.toDate ? rawEnd.toDate() : rawEnd ? new Date(rawEnd) : null;
    const endsAt = parsedEnd && (document.accessEndsAt || document.endAtExclusive) && !document.trialEndsAt ? new Date(parsedEnd.getTime() - 1) : parsedEnd;
    return { status, source: document.source || 'server', endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null };
  }
  return { status: ACCESS.INACTIVE, source: 'invalid_server_status', endsAt: null };
}

export function isAiAllowed(access) {
  return [ACCESS.UNLIMITED, ACCESS.ACTIVE, ACCESS.DATED, ACCESS.TRIAL].includes(access?.status);
}

export function parseJakartaDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}
