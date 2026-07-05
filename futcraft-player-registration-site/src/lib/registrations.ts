export const LOCAL_STORAGE_KEY = "futcraft_registros";
export const REGISTRATIONS_UPDATED_EVENT = "futcraft:registrations-updated";
export const REGISTRATION_LOCK_KEY = "futcraft:registration-locked";
export const NATIONALITY_REROLL_USED_KEY = "futcraft:nationality-reroll-used";

export type LocalRegistration = {
  id: string;
  criadoEm: string;
  nickMinecraft: string;
  discordTag: string;
  posicao: string;
  nacionalidade: string;
  fotoCabecaDataUrl?: string;
};

export function readLocalRegistrations(): LocalRegistration[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalRegistration[]) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}
