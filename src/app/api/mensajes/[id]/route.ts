import { NextResponse } from "next/server";
import { obtenerDetalleHilo } from "@/services/mensajes";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const detalle = await obtenerDetalleHilo(id, "uid-invitado", false);

    if (!detalle) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(detalle, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/mensajes/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}