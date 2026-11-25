export function buildChatContext(transactions, envelopes, now = new Date()) {
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const recent = transactions.filter((item) => new Date(item.occurredAt).getTime() >= cutoff);
  const balance = (envelopes || []).map((envelope) => ({ name: envelope.name, budget: envelope.budget }));
  return { balance, recentTransactions: recent.map((item) => ({ amount: item.amount, kind: item.kind, category: item.category, date: item.occurredAt })) };
}

export async function askProvider(provider, key, question, context, customEndpoint) {
  if (!String(question).trim()) throw new Error('Tulis pertanyaan terlebih dahulu.');
  const prompt = `Jawab pertanyaan budgeting dengan ringkas berdasarkan konteks lokal berikut.\nKonteks: ${JSON.stringify(context)}\nPertanyaan: ${question}`;
  let endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  let headers = { 'Content-Type': 'application/json', 'x-goog-api-key': key };
  let body = { contents: [{ parts: [{ text: prompt }] }] };
  if (provider === 'OpenRouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    body = { model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }] };
  }
  if (provider === 'Custom') {
    if (!/^https:\/\//i.test(customEndpoint || '')) throw new Error('Masukkan endpoint HTTPS yang kompatibel dengan OpenAI Chat Completions.');
    endpoint = customEndpoint;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    body = { model: 'custom', messages: [{ role: 'user', content: prompt }] };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Provider AI gagal (${response.status}).`);
    const json = await response.json();
    const answer = provider === 'Gemini' ? json.candidates?.[0]?.content?.parts?.[0]?.text : json.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('Jawaban AI kosong atau tidak valid.');
    return answer;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Permintaan AI melewati batas waktu.');
    throw error;
  } finally { clearTimeout(timeout); }
}
