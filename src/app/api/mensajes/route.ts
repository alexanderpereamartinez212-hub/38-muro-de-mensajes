import { NextResponse } from "next/server";
import { mensajeSchema } from "@/schemas/mensaje";
import { mensajes, type Mensaje } from "@/lib/almacen";
import { permitirPublicar } from "@/lib/limitador";

export async function GET() {
  const principales = mensajes.filter((m) => m.respuestaA === null);
  return NextResponse.json({ items: principales, siguienteCursor: null });
}

export async function POST(request: Request) {
  const uid = "uid-invitado";

  if (!permitirPublicar(uid)) {
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
    uid,
    nombre: "Invitado",
    texto: resultado.data.texto,
    respuestaA: null,
    creadoEn: new Date().toISOString(),
  };
  mensajes.unshift(nuevo);
  return NextResponse.json(nuevo, { status: 201 });
}
