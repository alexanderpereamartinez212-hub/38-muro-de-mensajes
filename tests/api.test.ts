import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/firebaseAdmin", () => ({ db: {} }));

const estadoMock = vi.hoisted(() => ({
  usuarioActual: null as {
    uid: string;
    correo: string;
    nombre: string;
    rol: "usuario" | "moderador" | "admin";
  } | null,
  mensajes: [] as Array<{
    id: string;
    uid: string;
    nombre: string;
    texto: string;
    respuestaA: string | null;
    oculto: boolean;
    reportes: number;
    creadoEn: string;
    conteo: Record<string, number>;
    reaccionPropia: "👍" | "❤️" | "😂" | "🎉" | null;
  }>,
  reacciones: new Map<string, "👍" | "❤️" | "😂" | "🎉">(),
  bloqueos: new Map<string, string | null>(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    obtenerUsuarioOpcional: vi.fn(async () => estadoMock.usuarioActual),
    requerirUsuario: vi.fn(async () => {
      if (!estadoMock.usuarioActual) {
        throw new actual.ErrorHttp(401, "Debes iniciar sesión");
      }
      return estadoMock.usuarioActual;
    }),
    requerirModerador: vi.fn(async () => {
      if (!estadoMock.usuarioActual) {
        throw new actual.ErrorHttp(401, "Debes iniciar sesión");
      }
      if (
        estadoMock.usuarioActual.rol !== "moderador" &&
        estadoMock.usuarioActual.rol !== "admin"
      ) {
        throw new actual.ErrorHttp(403, "Se requieren permisos de moderador");
      }
      return estadoMock.usuarioActual;
    }),
  };
});

vi.mock("@/repositories/mensajesRepo", () => ({
  listarMensajes: vi.fn(async (_uid: string, opts?: { incluirOcultos?: boolean; soloRaiz?: boolean; filtroUid?: string }) => {
    let lista = [...estadoMock.mensajes];
    if (opts?.filtroUid) lista = lista.filter((m) => m.uid === opts.filtroUid);
    if (!opts?.incluirOcultos) lista = lista.filter((m) => !m.oculto);
    if (opts?.soloRaiz) lista = lista.filter((m) => !m.respuestaA);
    return { items: lista, siguienteCursor: null };
  }),
  crearMensajeEnFirestore: vi.fn(async (datos: { uid: string; nombre: string; texto: string; respuestaA?: string | null }) => {
    const creado = {
      id: `msg-${estadoMock.mensajes.length + 1}`,
      uid: datos.uid,
      nombre: datos.nombre,
      texto: datos.texto,
      respuestaA: datos.respuestaA ?? null,
      oculto: false,
      reportes: 0,
      creadoEn: new Date().toISOString(),
      conteo: {},
      reaccionPropia: null,
    };
    estadoMock.mensajes.unshift(creado);
    return creado;
  }),
  obtenerMensajeConRespuestas: vi.fn(async (id: string) => {
    const mensaje = estadoMock.mensajes.find((m) => m.id === id && !m.oculto);
    if (!mensaje) return null;
    const respuestas = estadoMock.mensajes.filter((m) => m.respuestaA === id && !m.oculto);
    return { mensaje, respuestas };
  }),
  obtenerReaccionUsuario: vi.fn(async (mensajeId: string, uid: string) => {
    return estadoMock.reacciones.get(`${mensajeId}:${uid}`);
  }),
  guardarReaccionEnFirestore: vi.fn(async (mensajeId: string, uid: string, emoji?: "👍" | "❤️" | "😂" | "🎉") => {
    const clave = `${mensajeId}:${uid}`;
    if (!emoji) estadoMock.reacciones.delete(clave);
    else estadoMock.reacciones.set(clave, emoji);

    const conteo: Record<string, number> = {};
    for (const [k, e] of estadoMock.reacciones.entries()) {
      if (k.startsWith(`${mensajeId}:`)) {
        conteo[e] = (conteo[e] ?? 0) + 1;
      }
    }
    return conteo;
  }),
  reportarMensajeEnFirestore: vi.fn(async (id: string) => {
    const m = estadoMock.mensajes.find((x) => x.id === id);
    if (!m) return false;
    m.reportes += 1;
    return true;
  }),
  cambiarVisibilidadMensaje: vi.fn(async (id: string, oculto: boolean) => {
    const m = estadoMock.mensajes.find((x) => x.id === id);
    if (!m) return false;
    m.oculto = oculto;
    return true;
  }),
  bloquearUsuarioHasta: vi.fn(async (uid: string, hasta: string | null) => {
    estadoMock.bloqueos.set(uid, hasta);
  }),
  obtenerBloqueoUsuario: vi.fn(async (uid: string) => {
    return estadoMock.bloqueos.get(uid) ?? null;
  }),
}));

import { GET as getMensajes, POST as postMensajes } from "@/app/api/mensajes/route";
import { POST as postReaccion } from "@/app/api/mensajes/[id]/reaccion/route";
import {
  GET as getModeracion,
} from "@/app/api/moderacion/mensajes/route";
import { PATCH as patchModeracion } from "@/app/api/moderacion/mensajes/[id]/route";

describe("API e integración de Muro de Mensajes", () => {
  beforeEach(() => {
    estadoMock.usuarioActual = null;
    estadoMock.mensajes = [];
    estadoMock.reacciones.clear();
    estadoMock.bloqueos.clear();
  });

  it("rechaza con 401 al publicar sin sesión", async () => {
    const req = new Request("http://localhost:3000/api/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: "Hola mundo" }),
    });

    const resp = await postMensajes(req);
    expect(resp.status).toBe(401);
  });

  it("rechaza con 400 cuando el mensaje está vacío o supera 280 caracteres", async () => {
    estadoMock.usuarioActual = {
      uid: "u1",
      correo: "ana@ejemplo.com",
      nombre: "Ana",
      rol: "usuario",
    };

    const reqVacio = new Request("http://localhost:3000/api/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: "   " }),
    });
    const respVacio = await postMensajes(reqVacio);
    expect(respVacio.status).toBe(400);

    const reqLargo = new Request("http://localhost:3000/api/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: "a".repeat(281) }),
    });
    const respLargo = await postMensajes(reqLargo);
    expect(respLargo.status).toBe(400);
  });

  it("rechaza con 403 si un usuario sin rol moderador accede a moderación", async () => {
    estadoMock.usuarioActual = {
      uid: "u1",
      correo: "ana@ejemplo.com",
      nombre: "Ana",
      rol: "usuario",
    };

    const req = new Request("http://localhost:3000/api/moderacion/mensajes");
    const resp = await getModeracion(req);
    expect(resp.status).toBe(403);
  });

  it("flujo integrado: publica, lista, reacciona y oculta desde moderación", async () => {
    estadoMock.usuarioActual = {
      uid: "u1",
      correo: "ana@ejemplo.com",
      nombre: "Ana",
      rol: "usuario",
    };

    // 1. Publicar mensaje
    const crearResp = await postMensajes(
      new Request("http://localhost:3000/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: "Primer mensaje integrado" }),
      }),
    );
    expect(crearResp.status).toBe(201);
    const creado = await crearResp.json();
    expect(creado.id).toBe("msg-1");

    // 2. Reaccionar
    const reaccResp = await postReaccion(
      new Request(`http://localhost:3000/api/mensajes/${creado.id}/reaccion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: "👍" }),
      }),
      { params: Promise.resolve({ id: creado.id }) },
    );
    expect(reaccResp.status).toBe(200);
    const reaccDatos = await reaccResp.json();
    expect(reaccDatos.conteo["👍"]).toBe(1);

    // 3. Moderador oculta el mensaje
    estadoMock.usuarioActual = {
      uid: "mod1",
      correo: "mod@ejemplo.com",
      nombre: "Moderador",
      rol: "moderador",
    };

    const modResp = await patchModeracion(
      new Request(`http://localhost:3000/api/moderacion/mensajes/${creado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oculto: true }),
      }),
      { params: Promise.resolve({ id: creado.id }) },
    );
    expect(modResp.status).toBe(200);

    // 4. El muro público ya no lo devuelve
    const muroResp = await getMensajes(new Request("http://localhost:3000/api/mensajes"));
    const muroDatos = await muroResp.json();
    expect(muroDatos.items).toHaveLength(0);
  });
});