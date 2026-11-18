import { db } from "@/lib/firebaseAdmin";
import type { Mensaje } from "@/lib/almacen";
import type { Emoji } from "@/services/reacciones";

const COLECCION = "mensajes";
const COLECCION_USUARIOS = "usuarios";

export type MensajeCompleto = Mensaje & {
  oculto: boolean;
  reportes: number;
  conteo: Record<string, number>;
  reaccionPropia: Emoji | null;
};

async function mapearDocumento(
  doc: FirebaseFirestore.DocumentSnapshot,
  uidActual: string,
): Promise<MensajeCompleto> {
  const data = doc.data() ?? {};
  const reaccionesSnap = await doc.ref.collection("reacciones").get();

  const conteo: Record<string, number> = {};
  let reaccionPropia: Emoji | null = null;

  reaccionesSnap.forEach((rDoc) => {
    const emoji = rDoc.data().emoji as Emoji;
    if (emoji) {
      conteo[emoji] = (conteo[emoji] ?? 0) + 1;
      if (rDoc.id === uidActual) {
        reaccionPropia = emoji;
      }
    }
  });

  return {
    id: doc.id,
    uid: data.uid ?? "uid-invitado",
    nombre: data.nombre ?? "Invitado",
    texto: data.texto ?? "",
    respuestaA: data.respuestaA ?? null,
    oculto: Boolean(data.oculto),
    reportes: Number(data.reportes ?? 0),
    creadoEn: data.creadoEn ?? new Date().toISOString(),
    conteo,
    reaccionPropia,
  };
}

export async function listarMensajes(
  uidActual: string,
  opciones?: {
    filtroUid?: string;
    incluirOcultos?: boolean;
    soloRaiz?: boolean;
    limite?: number;
    cursor?: string | null;
  },
): Promise<{ items: MensajeCompleto[]; siguienteCursor: string | null }> {
  const snapshot = await db
    .collection(COLECCION)
    .orderBy("creadoEn", "desc")
    .get();

  let docs = snapshot.docs;

  if (opciones?.filtroUid) {
    docs = docs.filter((d) => d.data().uid === opciones.filtroUid);
  }
  if (!opciones?.incluirOcultos) {
    docs = docs.filter((d) => !d.data().oculto);
  }
  if (opciones?.soloRaiz) {
    docs = docs.filter((d) => !d.data().respuestaA);
  }

  if (opciones?.cursor) {
    const idx = docs.findIndex((d) => d.id === opciones.cursor);
    if (idx !== -1) {
      docs = docs.slice(idx + 1);
    }
  }

  const limite = Math.min(Math.max(opciones?.limite ?? 20, 1), 100);
  const hayMas = docs.length > limite;
  const paginaDocs = docs.slice(0, limite);
  const siguienteCursor = hayMas ? paginaDocs[paginaDocs.length - 1].id : null;

  const items = await Promise.all(
    paginaDocs.map((doc) => mapearDocumento(doc, uidActual)),
  );

  return { items, siguienteCursor };
}

export async function obtenerMensajeConRespuestas(
  id: string,
  uidActual: string,
  incluirOcultos = false,
): Promise<{ mensaje: MensajeCompleto; respuestas: MensajeCompleto[] } | null> {
  const docRef = db.collection(COLECCION).doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) return null;

  const mensaje = await mapearDocumento(docSnap, uidActual);
  if (mensaje.oculto && !incluirOcultos) return null;

  const snapshot = await db
    .collection(COLECCION)
    .orderBy("creadoEn", "asc")
    .get();

  const respuestasDocs = snapshot.docs.filter((d) => {
    const data = d.data();
    if (data.respuestaA !== id) return false;
    if (data.oculto && !incluirOcultos) return false;
    return true;
  });

  const respuestas = await Promise.all(
    respuestasDocs.map((d) => mapearDocumento(d, uidActual)),
  );

  return { mensaje, respuestas };
}

export async function crearMensajeEnFirestore(datos: {
  uid: string;
  nombre: string;
  texto: string;
  respuestaA?: string | null;
}): Promise<MensajeCompleto> {
  const nuevoDoc = {
    uid: datos.uid,
    nombre: datos.nombre,
    texto: datos.texto,
    respuestaA: datos.respuestaA ?? null,
    oculto: false,
    reportes: 0,
    creadoEn: new Date().toISOString(),
  };

  const ref = await db.collection(COLECCION).add(nuevoDoc);

  return {
    id: ref.id,
    ...nuevoDoc,
    conteo: {},
    reaccionPropia: null,
  };
}

export async function obtenerReaccionUsuario(
  mensajeId: string,
  uid: string,
): Promise<Emoji | undefined> {
  const doc = await db
    .collection(COLECCION)
    .doc(mensajeId)
    .collection("reacciones")
    .doc(uid)
    .get();

  return doc.exists ? (doc.data()?.emoji as Emoji | undefined) : undefined;
}

export async function guardarReaccionEnFirestore(
  mensajeId: string,
  uid: string,
  emoji: Emoji | undefined,
): Promise<Record<string, number>> {
  const mensajeRef = db.collection(COLECCION).doc(mensajeId);
  const reaccionRef = mensajeRef.collection("reacciones").doc(uid);

  if (emoji === undefined) {
    await reaccionRef.delete();
  } else {
    await reaccionRef.set({ emoji });
  }

  const reaccionesSnap = await mensajeRef.collection("reacciones").get();
  const conteo: Record<string, number> = {};

  reaccionesSnap.forEach((rDoc) => {
    const e = rDoc.data().emoji as Emoji;
    if (e) {
      conteo[e] = (conteo[e] ?? 0) + 1;
    }
  });

  return conteo;
}

export async function reportarMensajeEnFirestore(mensajeId: string): Promise<boolean> {
  const ref = db.collection(COLECCION).doc(mensajeId);
  const snap = await ref.get();
  if (!snap.exists) return false;

  const actuales = Number(snap.data()?.reportes ?? 0);
  await ref.update({ reportes: actuales + 1 });
  return true;
}

export async function cambiarVisibilidadMensaje(
  mensajeId: string,
  oculto: boolean,
): Promise<boolean> {
  const ref = db.collection(COLECCION).doc(mensajeId);
  const snap = await ref.get();
  if (!snap.exists) return false;

  await ref.update({ oculto });
  return true;
}

export async function bloquearUsuarioHasta(
  uid: string,
  bloqueadoHasta: string | null,
): Promise<void> {
  await db
    .collection(COLECCION_USUARIOS)
    .doc(uid)
    .collection("estado")
    .doc("actual")
    .set({ bloqueadoHasta }, { merge: true });
}

export async function obtenerBloqueoUsuario(uid: string): Promise<string | null> {
  const snap = await db
    .collection(COLECCION_USUARIOS)
    .doc(uid)
    .collection("estado")
    .doc("actual")
    .get();

  if (!snap.exists) return null;
  const hasta = snap.data()?.bloqueadoHasta as string | null | undefined;
  return hasta ?? null;
}