export const EMOJIS = ["👍", "❤️", "😂", "🎉"] as const;
export type Emoji = (typeof EMOJIS)[number];

export function alternarReaccion(
  actual: Emoji | undefined,
  nuevo: Emoji,
): Emoji | undefined {
  return actual === nuevo ? undefined : nuevo;
}

export function contar(porUsuario: Map<string, Emoji>): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const emoji of porUsuario.values()) {
    conteo[emoji] = (conteo[emoji] ?? 0) + 1;
  }
  return conteo;
}
