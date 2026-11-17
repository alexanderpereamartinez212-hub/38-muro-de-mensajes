import type { Emoji } from "@/services/reacciones";

const global = globalThis as unknown as {
  __reacciones?: Map<string, Map<string, Emoji>>;
};

if (!global.__reacciones) {
  global.__reacciones = new Map();
}

export const reacciones = global.__reacciones;
