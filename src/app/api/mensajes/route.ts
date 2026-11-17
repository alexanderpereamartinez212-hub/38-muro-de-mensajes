import { NextResponse } from "next/server";
import { mensajeSchema } from "@/schemas/mensaje";
import { mensajes, type Mensaje } from "@/lib/almacen";
import { permitirPublicar } from "@/lib/limitador";
import { reacciones } from "@/lib/reacciones";
import { contar } from "@/services/reacciones";

const UID = "uid-invitado";

export async function GET() {
  const items = mensajes
    .filter((m) => m.respuestaA === null)
    .map((m) => {
      const porUsuario = reacciones.get(m.id);
      return {
        ...m,
        conteo: porUsuario ? contar(porUsuario) : {},
        reaccionPropia: porUsuario?.get(UID) ?? null,
      };
    });
  return NextResponse.json({ items, siguienteCursor: null });
}

export async function POST(request: Request) {
  if (!permitirPublicar(UID)) {
    return NextResponse.json(
      { error: "Demasiados mensajes. Espera un minuto e intenta de nuevo." },
      { status: 429 },
    );
  }

  const cuerpo = await request.json().catch(() => null);
  const resultado = mensajeSchema.safeParse(cuerpo);

  if (!resultado.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        detalles: resultado.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const nuevo: Mensaje = {
    id: crypto.randomUUID(),
    uid: UID,
    nombre: "Invitado",
    texto: resultado.data.texto,
    respuestaA: null,
    creadoEn: new Date().toISOString(),
  };
  mensajes.unshift(nuevo);
  return NextResponse.json(nuevo, { status: 201 });
}
