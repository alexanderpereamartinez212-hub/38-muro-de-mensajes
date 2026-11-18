import { mensajeSchema } from "@/schemas/mensaje";
import { permitirPublicar } from "@/lib/limitador";
import { alternarReaccion, EMOJIS, type Emoji } from "@/services/reacciones";
import {
  bloquearUsuarioHasta,
  cambiarVisibilidadMensaje,
  crearMensajeEnFirestore,
  guardarReaccionEnFirestore,
  listarMensajes,
  obtenerBloqueoUsuario,
  obtenerMensajeConRespuestas,
  obtenerReaccionUsuario,
  reportarMensajeEnFirestore,
} from "@/repositories/mensajesRepo";

export async function obtenerMuro(
  uidActual: string,
  opciones?: {
    filtroUid?: string;
    incluirOcultos?: boolean;
    soloRaiz?: boolean;
    limite?: number;
    cursor?: string | null;
  },
) {
  const resultado = await listarMensajes(uidActual, opciones);
  return resultado.items;
}

export async function obtenerMuroPaginado(
  uidActual: string,
  opciones?: {
    filtroUid?: string;
    incluirOcultos?: boolean;
    soloRaiz?: boolean;
    limite?: number;
    cursor?: string | null;
  },
) {
  return listarMensajes(uidActual, opciones);
}

export async function obtenerDetalleHilo(
  id: string,
  uidActual: string,
  incluirOcultos = false,
) {
  return obtenerMensajeConRespuestas(id, uidActual, incluirOcultos);
}

export async function publicarMensaje(entrada: {
  texto: unknown;
  uid: string;
  nombre: string;
  respuestaA?: string | null;
}) {
  const bloqueadoHasta = await obtenerBloqueoUsuario(entrada.uid);
  if (bloqueadoHasta && new Date(bloqueadoHasta).getTime() > Date.now()) {
    return {
      ok: false as const,
      status: 403,
      error: `Tu cuenta está bloqueada temporalmente hasta ${new Date(bloqueadoHasta).toLocaleString("es")}.`,
    };
  }

  if (!permitirPublicar(entrada.uid)) {
    return {
      ok: false as const,
      status: 429,
      error: "Demasiados mensajes. Espera un minuto antes de volver a publicar.",
    };
  }

  const validacion = mensajeSchema.safeParse({ texto: entrada.texto });
  if (!validacion.success) {
    return {
      ok: false as const,
      status: 400,
      error: validacion.error.issues[0].message,
      detalles: validacion.error.issues.map((i) => ({
        campo: "texto",
        mensaje: i.message,
      })),
    };
  }

  if (entrada.respuestaA) {
    const padre = await obtenerMensajeConRespuestas(entrada.respuestaA, entrada.uid, false);
    if (!padre) {
      return {
        ok: false as const,
        status: 404,
        error: "El mensaje al que intentas responder no existe.",
      };
    }
  }

  const creado = await crearMensajeEnFirestore({
    uid: entrada.uid,
    nombre: entrada.nombre,
    texto: validacion.data.texto,
    respuestaA: entrada.respuestaA ?? null,
  });

  return {
    ok: true as const,
    status: 201,
    mensaje: creado,
  };
}

export async function procesarReaccion(
  mensajeId: string,
  uid: string,
  emojiRecibido: unknown,
) {
  if (
    typeof emojiRecibido !== "string" ||
    !EMOJIS.includes(emojiRecibido as Emoji)
  ) {
    return {
      ok: false as const,
      status: 400,
      error: "Emoji no válido",
    };
  }

  const nuevoEmoji = emojiRecibido as Emoji;
  const actual = await obtenerReaccionUsuario(mensajeId, uid);
  const resultante = alternarReaccion(actual, nuevoEmoji);
  const conteo = await guardarReaccionEnFirestore(mensajeId, uid, resultante);

  return {
    ok: true as const,
    status: 200,
    reaccionPropia: resultante ?? null,
    conteo,
  };
}

export async function reportarMensaje(mensajeId: string) {
  const ok = await reportarMensajeEnFirestore(mensajeId);
  if (!ok) {
    return { ok: false as const, status: 404, error: "Mensaje no encontrado" };
  }
  return { ok: true as const, status: 200 };
}

export async function moderarMensaje(mensajeId: string, oculto: boolean) {
  const ok = await cambiarVisibilidadMensaje(mensajeId, oculto);
  if (!ok) {
    return { ok: false as const, status: 404, error: "Mensaje no encontrado" };
  }
  return { ok: true as const, status: 200 };
}

export async function moderarUsuario(uid: string, minutosBloqueo: number) {
  const hasta =
    minutosBloqueo > 0
      ? new Date(Date.now() + minutosBloqueo * 60_000).toISOString()
      : null;
  await bloquearUsuarioHasta(uid, hasta);
  return { ok: true as const, status: 200, bloqueadoHasta: hasta };
}