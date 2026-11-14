import { NextResponse } from "next/server";
import { mensajes } from "@/lib/almacen";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mensaje = mensajes.find((m) => m.id === id && m.respuestaA === null);

  if (!mensaje) {
    return NextResponse.json(
      { error: "Mensaje no encontrado" },
      { status: 404 },
    );
  }

  const respuestas = mensajes.filter((m) => m.respuestaA === id).reverse();
  return NextResponse.json({ mensaje, respuestas });
}