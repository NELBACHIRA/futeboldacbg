"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { drawRandomNationality } from "@/lib/nationalities";
import {
  LOCAL_STORAGE_KEY,
  NATIONALITY_REROLL_USED_KEY,
  REGISTRATION_LOCK_KEY,
  REGISTRATIONS_UPDATED_EVENT,
  type LocalRegistration,
} from "@/lib/registrations";
import {
  POSITIONS,
  isValidDiscordTag,
  isValidMinecraftNick,
  isValidPosition,
} from "@/lib/validators";

type AlertState = {
  type: "success" | "error";
  title: string;
  message: string;
};

type FormState = {
  nickMinecraft: string;
  discordTag: string;
  posicao: string;
  nacionalidade: string;
  compromisso: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>> & {
  fotoCabeca?: string;
};

const INITIAL_STATE: FormState = {
  nickMinecraft: "",
  discordTag: "",
  posicao: "",
  nacionalidade: "",
  compromisso: false,
};

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Falha ao processar a imagem."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem."));
    reader.readAsDataURL(file);
  });
}

async function insertRegistration(data: {
  nickMinecraft: string;
  discordTag: string;
  posicao: string;
  nacionalidade: string;
  fotoCabecaDataUrl: string;
}) {
  try {
    if (typeof window === "undefined") {
      return {
        ok: false,
        message: "Não foi possível salvar no modo local neste ambiente.",
      };
    }

    if (window.localStorage.getItem(REGISTRATION_LOCK_KEY) === "true") {
      return {
        ok: false,
        message: "Este navegador já concluiu um registro e está bloqueado para novos cadastros.",
      };
    }

    const previousRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const previousList: LocalRegistration[] = previousRaw ? JSON.parse(previousRaw) : [];

    const newEntry: LocalRegistration = {
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
      nickMinecraft: data.nickMinecraft,
      discordTag: data.discordTag,
      posicao: data.posicao,
      nacionalidade: data.nacionalidade,
      fotoCabecaDataUrl: data.fotoCabecaDataUrl,
    };

    const nextList = [newEntry, ...previousList];
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
    window.localStorage.setItem(REGISTRATION_LOCK_KEY, "true");
    window.dispatchEvent(new Event(REGISTRATIONS_UPDATED_EVENT));

    return {
      ok: true,
      message: "Registro salvo com sucesso (modo local).",
    };
  } catch {
    return {
      ok: false,
      message: "Erro ao salvar localmente. Verifique as permissões do navegador.",
    };
  }
}

export function RegistrationForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [fotoCabecaDataUrl, setFotoCabecaDataUrl] = useState("");
  const [fotoCabecaNome, setFotoCabecaNome] = useState("");
  const [hasUsedNationalityReroll, setHasUsedNationalityReroll] = useState(false);
  const [isRegistrationLocked, setIsRegistrationLocked] = useState(false);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isLocked = window.localStorage.getItem(REGISTRATION_LOCK_KEY) === "true";
    const rerollUsed = window.localStorage.getItem(NATIONALITY_REROLL_USED_KEY) === "true";

    setIsRegistrationLocked(isLocked);
    setHasUsedNationalityReroll(rerollUsed);
    setForm((prev) => ({ ...prev, nacionalidade: drawRandomNationality() }));

    if (isLocked) {
      setAlert({
        type: "error",
        title: "Registro já utilizado",
        message: "Este dispositivo já realizou um cadastro e não pode enviar outro.",
      });
    }
  }, []);

  const isFormDisabled = useMemo(() => isSubmitting || isRegistrationLocked, [isRegistrationLocked, isSubmitting]);

  const canGenerateNationality = useMemo(
    () => !isFormDisabled && !hasUsedNationalityReroll,
    [hasUsedNationalityReroll, isFormDisabled],
  );

  function generateNationality() {
    if (!canGenerateNationality || typeof window === "undefined") {
      return;
    }

    setForm((prev) => ({ ...prev, nacionalidade: drawRandomNationality() }));
    window.localStorage.setItem(NATIONALITY_REROLL_USED_KEY, "true");
    setHasUsedNationalityReroll(true);
    setAlert(null);
  }

  async function onSelectHeadPhoto(file: File | null) {
    if (!file) {
      setFotoCabecaDataUrl("");
      setFotoCabecaNome("");
      setErrors((prev) => ({ ...prev, fotoCabeca: "Foto da cabeça da skin é obrigatória." }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFotoCabecaDataUrl("");
      setFotoCabecaNome("");
      setErrors((prev) => ({ ...prev, fotoCabeca: "Envie um arquivo de imagem válido (PNG/JPG/WebP)." }));
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFotoCabecaDataUrl("");
      setFotoCabecaNome("");
      setErrors((prev) => ({ ...prev, fotoCabeca: "A imagem deve ter no máximo 2MB." }));
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setFotoCabecaDataUrl(dataUrl);
      setFotoCabecaNome(file.name);
      setErrors((prev) => ({ ...prev, fotoCabeca: undefined }));
    } catch {
      setFotoCabecaDataUrl("");
      setFotoCabecaNome("");
      setErrors((prev) => ({ ...prev, fotoCabeca: "Não foi possível processar a imagem enviada." }));
    }
  }

  function validateForm(): boolean {
    const nextErrors: FieldErrors = {};

    if (!isValidMinecraftNick(form.nickMinecraft)) {
      nextErrors.nickMinecraft =
        "Informe um nick válido (3-16 caracteres, apenas letras, números e _).";
    }

    if (!isValidDiscordTag(form.discordTag)) {
      nextErrors.discordTag =
        "Discord inválido. Use NomeDeUsuario ou o formato antigo Nome#0000.";
    }

    if (!isValidPosition(form.posicao)) {
      nextErrors.posicao = "Selecione uma posição válida em campo.";
    }

    if (!form.nacionalidade) {
      nextErrors.nacionalidade = "A nacionalidade precisa ser sorteada.";
    }

    if (!fotoCabecaDataUrl) {
      nextErrors.fotoCabeca = "Foto da cabeça da skin é obrigatória.";
    }

    if (!form.compromisso) {
      nextErrors.compromisso =
        "Você precisa aceitar o termo de compromisso para se registrar.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);

    if (isRegistrationLocked) {
      setAlert({
        type: "error",
        title: "Registro bloqueado",
        message: "Este dispositivo já fez um cadastro. Apenas um registro é permitido por acesso.",
      });
      return;
    }

    if (!validateForm()) {
      setAlert({
        type: "error",
        title: "Falha de validação",
        message: "Corrija os campos destacados e tente novamente.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await insertRegistration({
        nickMinecraft: form.nickMinecraft.trim(),
        discordTag: form.discordTag.trim(),
        posicao: form.posicao,
        nacionalidade: form.nacionalidade,
        fotoCabecaDataUrl,
      });

      if (!result.ok) {
        setAlert({
          type: "error",
          title: "Erro ao registrar",
          message:
            result.message ||
            "Não foi possível salvar seu registro agora. Tente novamente em instantes.",
        });
        return;
      }

      setAlert({
        type: "success",
        title: "Sucesso",
        message: `${result.message} Este dispositivo foi bloqueado para novos registros.`,
      });

      setIsRegistrationLocked(true);
      setErrors({});
      setFotoCabecaDataUrl("");
      setFotoCabecaNome("");
      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }
      setForm((prev) => ({
        ...prev,
        compromisso: false,
      }));
    } catch {
      setAlert({
        type: "error",
        title: "Erro inesperado",
        message:
          "Ocorreu uma instabilidade ao enviar seus dados. Verifique a conexão e tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {isRegistrationLocked ? (
        <AlertBanner
          type="error"
          title="Registro único já utilizado"
          message="Este navegador já concluiu um cadastro. Para integridade da liga, novos registros foram bloqueados."
        />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="nickMinecraft" className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Nick do Minecraft
        </label>
        <input
          id="nickMinecraft"
          type="text"
          value={form.nickMinecraft}
          onChange={(event) => setForm((prev) => ({ ...prev, nickMinecraft: event.target.value }))}
          placeholder="Ex: FutPro_10"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-cyan-400/70 focus:bg-black/45 disabled:cursor-not-allowed disabled:opacity-60"
          autoComplete="off"
          maxLength={16}
          disabled={isFormDisabled}
        />
        {errors.nickMinecraft ? <p className="text-xs text-rose-300">{errors.nickMinecraft}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="fotoCabeca" className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Foto da Cabeça da Skin (Obrigatório)
        </label>
        <input
          ref={inputFileRef}
          id="fotoCabeca"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          required
          disabled={isFormDisabled}
          onChange={(event) => {
            void onSelectHeadPhoto(event.target.files?.[0] ?? null);
          }}
          className="block w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cyan-100 hover:file:bg-cyan-500/35 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="text-[11px] text-white/50">Use uma imagem da cabeça da skin. Tamanho máximo: 2MB.</p>

        {fotoCabecaDataUrl ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-2">
            <img
              src={fotoCabecaDataUrl}
              alt="Pré-visualização da cabeça da skin"
              className="h-14 w-14 rounded-lg border border-white/20 object-cover"
            />
            <p className="text-xs text-cyan-100">Arquivo selecionado: {fotoCabecaNome}</p>
          </div>
        ) : null}

        {errors.fotoCabeca ? <p className="text-xs text-rose-300">{errors.fotoCabeca}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="discordTag" className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Discord Tag
        </label>
        <input
          id="discordTag"
          type="text"
          value={form.discordTag}
          onChange={(event) => setForm((prev) => ({ ...prev, discordTag: event.target.value }))}
          placeholder="Ex: comandoelite ou ComandoElite#1234"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-cyan-400/70 focus:bg-black/45 disabled:cursor-not-allowed disabled:opacity-60"
          autoComplete="off"
          disabled={isFormDisabled}
        />
        {errors.discordTag ? <p className="text-xs text-rose-300">{errors.discordTag}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="posicao" className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Posição em Campo
        </label>
        <select
          id="posicao"
          value={form.posicao}
          onChange={(event) => setForm((prev) => ({ ...prev, posicao: event.target.value }))}
          className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/70 focus:bg-black/45 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFormDisabled}
        >
          <option value="" className="bg-zinc-900">
            Selecione sua posição
          </option>
          {POSITIONS.map((position) => (
            <option key={position} value={position} className="bg-zinc-900">
              {position}
            </option>
          ))}
        </select>
        {errors.posicao ? <p className="text-xs text-rose-300">{errors.posicao}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="nacionalidade" className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Nacionalidade Fictícia/Aleatória
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="nacionalidade"
            type="text"
            value={form.nacionalidade}
            readOnly
            className="w-full rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100 outline-none disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isFormDisabled}
          />
          <button
            type="button"
            onClick={generateNationality}
            disabled={!canGenerateNationality}
            className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {hasUsedNationalityReroll ? "Giro já utilizado" : "Gerar Nacionalidade"}
          </button>
        </div>
        <p className="text-[11px] text-white/50">Você só pode girar a nacionalidade 1 vez por acesso.</p>
        {errors.nacionalidade ? <p className="text-xs text-rose-300">{errors.nacionalidade}</p> : null}
      </div>

      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/85">
          <input
            type="checkbox"
            checked={form.compromisso}
            onChange={(event) => setForm((prev) => ({ ...prev, compromisso: event.target.checked }))}
            className="mt-1 h-4 w-4 rounded border-white/25 bg-black/30 text-emerald-400 focus:ring-emerald-400"
            disabled={isFormDisabled}
          />
          <span>
            Prometo jogar seriamente e cumprir os horários da liga. Inscrições falsas resultarão em banimento por IP.
          </span>
        </label>
        {errors.compromisso ? <p className="mt-2 text-xs text-rose-300">{errors.compromisso}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isFormDisabled}
        className="w-full rounded-xl border border-emerald-400/35 bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_35px_rgba(16,185,129,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Registrando..." : isRegistrationLocked ? "Registro Bloqueado" : "Confirmar Registro"}
      </button>

      {alert ? <AlertBanner type={alert.type} title={alert.title} message={alert.message} /> : null}
    </form>
  );
}
