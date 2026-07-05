export const NATIONALITIES = [
  "Brasil",
  "Argentina",
  "Alemanha",
  "Japão",
  "Estados Unidos",
  "França",
  "Portugal",
  "Itália",
  "Espanha",
  "Canadá",
  "Holanda",
  "México",
] as const;

export type Nationality = (typeof NATIONALITIES)[number];

export function drawRandomNationality(): Nationality {
  const index = Math.floor(Math.random() * NATIONALITIES.length);
  return NATIONALITIES[index] ?? "Brasil";
}
