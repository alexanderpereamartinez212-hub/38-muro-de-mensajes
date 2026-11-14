import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settings = JSON.parse(readFileSync(".claude/settings.json", "utf-8"));
const gitignore = readFileSync(".gitignore", "utf-8");
const agents = readFileSync("AGENTS.md", "utf-8");
const hook = readFileSync(".husky/pre-commit", "utf-8");

describe("Restricciones de la configuración de IA", () => {
  it("bloquea la lectura de .env y claves", () => {
    expect(settings.permissions.deny).toEqual(
      expect.arrayContaining(["Read(./.env)", "Read(./.env.*)"]),
    );
  });

  it("pide permiso antes de acciones con efecto externo", () => {
    expect(settings.permissions.ask).toEqual(
      expect.arrayContaining(["Bash(git push:*)", "Bash(vercel:*)"]),
    );
  });

  it("Git ignora los archivos .env", () => {
    expect(gitignore).toMatch(/\.env/);
  });

  it("las reglas del proyecto prohíben leer secretos", () => {
    expect(agents).toMatch(/No leer ni mostrar `\.env\*`/);
  });

  it("el hook de pre-commit ejecuta la revisión de calidad", () => {
    expect(hook).toMatch(/npm run check/);
  });
});