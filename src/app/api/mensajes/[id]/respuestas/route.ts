import { NextResponse } from "next/server";
import { mensajeSchema } from "@/schemas/mensaje";
import { mensajes, type Mensaje } from "@/lib/almacen";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const original = mensajes.find((m) => m.id === id && m.respuestaA === null);

  if (!original) {
    return NextResponse.json(
      { error: "Mensaje no encontrado" },
      { status: 404 },
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

  const nueva: Mensaje = {
    id: crypto.randomUUID(),
    uid: "uid-invitado",
    nombre: "Invitado",
    texto: resultado.data.texto,
    respuestaA: id,
    creadoEn: new Date().toISOString(),
  };
  mensajes.unshift(nueva);
  return NextResponse.json(nueva, { status: 201 });
}