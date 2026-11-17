import { describe, expect, it } from "vitest";
import { crearLimitador } from "./limiteFrecuencia";

describe("límite de frecuencia", () => {
  it("permite 5 por minuto y bloquea el sexto", () => {
    const permitir = crearLimitador(5, 60_000, () => 0);
    for (let i = 0; i < 5; i++) expect(permitir("ana")).toBe(true);
    expect(permitir("ana")).toBe(false);
  });

  it("vuelve a permitir cuando pasa el minuto", () => {
    let ahora = 0;
    const permitir = crearLimitador(5, 60_000, () => ahora);
    for (let i = 0; i < 5; i++) permitir("ana");
    expect(permitir("ana")).toBe(false);
    ahora = 60_001;
    expect(permitir("ana")).toBe(true);
  });

  it("cuenta cada persona por separado", () => {
    const permitir = crearLimitador(1, 60_000, () => 0);
    expect(permitir("ana")).toBe(true);
    expect(permitir("luis")).toBe(true);
    expect(permitir("ana")).toBe(false);
  });
});
