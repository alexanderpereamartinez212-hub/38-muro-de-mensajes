import { NextResponse } from "next/server";
import { mensajeSchema } from "@/schemas/mensaje";
import { mensajes, type Mensaje } from "@/lib/almacen";

export async function GET() {
  const principales = mensajes.filter((m) => m.respuestaA === null);
  return NextResponse.json({ items: principales, siguienteCursor: null });
}

export async function POST(request: Request) {
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
    uid: "uid-invitado",
    nombre: "Invitado",
    texto: resultado.data.texto,
    respuestaA: null,
    creadoEn: new Date().toISOString(),
  };
  mensajes.unshift(nuevo);
  return NextResponse.json(nuevo, { status: 201 });
}