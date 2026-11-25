export function sumAmounts(rows) {
  return rows.reduce((total, row) => total + Math.round(Number(row.amount) || 0), 0);
}

export function envelopeBalance(envelope, transactions, transfers = []) {
  const spent = transactions
    .filter((item) => item.envelopeId === envelope.id && item.kind !== 'income')
    .reduce((total, item) => total + Math.round(Number(item.amount) || 0), 0);
  const income = transactions
    .filter((item) => item.envelopeId === envelope.id && item.kind === 'income')
    .reduce((total, item) => total + Math.round(Number(item.amount) || 0), 0);
  const received = transfers.filter((item) => item.toEnvelopeId === envelope.id).reduce((total, item) => total + item.amount, 0);
  const sent = transfers.filter((item) => item.fromEnvelopeId === envelope.id).reduce((total, item) => total + item.amount, 0);
  return Math.round(envelope.budget) + income - spent + received - sent;
}

export function monthlyDelta(current, previous) {
  return Math.round(sumAmounts(current) - sumAmounts(previous));
}

export function transferBalances(from, to, amount) {
  const rupiah = Number(amount);
  if (!Number.isSafeInteger(rupiah) || rupiah <= 0) throw new Error('Nominal transfer tidak valid');
  if (from.balance < rupiah) throw new Error('Saldo amplop tidak mencukupi');
  return { fromBalance: from.balance - rupiah, toBalance: to.balance + rupiah };
}
