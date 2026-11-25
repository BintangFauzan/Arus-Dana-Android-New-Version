export function shouldPromptFeedback(saved = {}, now, delayDays = 2, cooldownHours = 48) {
  if (saved.neverAsk) return false;
  if (!saved.firstSeenAt || !Number.isFinite(now)) return false;
  const delay = Math.max(0, delayDays) * 24 * 60 * 60 * 1000;
  const cooldown = Math.max(1, cooldownHours) * 60 * 60 * 1000;
  if (now - saved.firstSeenAt < delay) return false;
  if (saved.lastPromptAt && now - saved.lastPromptAt < cooldown) return false;
  return true;
}
