import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutCraft Pro League | Registro de Jogadores",
  description:
    "Sistema oficial de registro de jogadores da FutCraft Pro League com validação anti-fake e registro em modo local.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#06090f] text-white antialiased">{children}</body>
    </html>
  );
}
