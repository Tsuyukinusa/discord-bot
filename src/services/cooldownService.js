export function initCooldown(user) {
  if (!user.cooldowns) user.cooldowns = {};
}

export function isOnCooldown(user, key, cooldownMs) {
  initCooldown(user);

  const last = user.cooldowns[key];
  if (!last) return false;

  return Date.now() - last < cooldownMs;
}

export function getRemaining(user, key, cooldownMs) {
  const passed = Date.now() - user.cooldowns[key];
  return Math.ceil((cooldownMs - passed) / 1000);
}

export function setCooldown(user, key) {
  initCooldown(user);
  user.cooldowns[key] = Date.now();
}
