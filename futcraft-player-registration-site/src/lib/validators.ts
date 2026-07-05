export const POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Meio-Campo",
  "Atacante",
] as const;

export type Position = (typeof POSITIONS)[number];

const minecraftNickRegex = /^[A-Za-z0-9_]{3,16}$/;
const discordModernRegex = /^[A-Za-z0-9._]{2,32}$/;
const discordLegacyRegex = /^.{2,32}#\d{4}$/;

export function isValidMinecraftNick(value: string): boolean {
  return minecraftNickRegex.test(value.trim());
}

export function isValidDiscordTag(value: string): boolean {
  const trimmed = value.trim();
  return discordModernRegex.test(trimmed) || discordLegacyRegex.test(trimmed);
}

export function isValidPosition(value: string): value is Position {
  return POSITIONS.includes(value as Position);
}
