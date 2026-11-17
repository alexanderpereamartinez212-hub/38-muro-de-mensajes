import { describe, expect, it } from "vitest";
import { alternarReaccion, contar, type Emoji } from "./reacciones";

describe("reacciones", () => {
  it("reaccionar dos veces con el mismo emoji quita la reacción", () => {
    const primera = alternarReaccion(undefined, "👍");
    expect(primera).toBe("👍");
    expect(alternarReaccion(primera, "👍")).toBeUndefined();
  });

  it("cambiar de emoji reemplaza la reacción", () => {
    expect(alternarReaccion("👍", "❤️")).toBe("❤️");
  });

  it("cuenta las reacciones por emoji", () => {
    const porUsuario = new Map<string, Emoji>([
      ["a", "👍"],
      ["b", "👍"],
      ["c", "🎉"],
    ]);
    expect(contar(porUsuario)).toEqual({ "👍": 2, "🎉": 1 });
  });
});
