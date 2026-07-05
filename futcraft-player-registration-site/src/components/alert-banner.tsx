type AlertBannerProps = {
  type: "success" | "error";
  title: string;
  message: string;
};

export function AlertBanner({ type, title, message }: AlertBannerProps) {
  const base =
    "rounded-xl border px-4 py-3 text-sm backdrop-blur-sm transition-all duration-300";

  const tone =
    type === "success"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
      : "border-rose-400/40 bg-rose-500/10 text-rose-100";

  return (
    <div className={`${base} ${tone}`} role="status" aria-live="polite">
      <p className="font-semibold tracking-wide">{title}</p>
      <p className="mt-1 text-xs text-white/80">{message}</p>
    </div>
  );
}
