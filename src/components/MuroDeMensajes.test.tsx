import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MuroDeMensajes from "./MuroDeMensajes";

const ana = {
  id: "1",
  nombre: "Ana",
  texto: "Hola a todos",
  creadoEn: "2026-11-14T17:00:00.000Z",
};

function simularRespuesta(items: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items, siguienteCursor: null }),
    }),
  );
}

describe("MuroDeMensajes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra los mensajes cuando la carga funciona", async () => {
    simularRespuesta([ana]);
    render(<MuroDeMensajes />);
    expect(await screen.findByText("Hola a todos")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay mensajes", async () => {
    simularRespuesta([]);
    render(<MuroDeMensajes />);
    expect(
      await screen.findByText(/Todavía no hay mensajes/),
    ).toBeInTheDocument();
  });

  it("muestra el error y el botón de reintento si falla la carga", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")));
    render(<MuroDeMensajes />);
    expect(
      await screen.findByText("No se pudieron cargar los mensajes."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });

  it("el contador cambia a error al pasar de 280 caracteres", async () => {
    simularRespuesta([]);
    render(<MuroDeMensajes />);
    await screen.findByText(/Todavía no hay mensajes/);

    const campo = screen.getByLabelText("Escribe tu mensaje");
    fireEvent.change(campo, { target: { value: "a".repeat(281) } });

    expect(screen.getByText(/Te pasaste por 1 caracteres/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });
});