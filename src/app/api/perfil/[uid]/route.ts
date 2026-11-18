import { NextResponse } from "next/server";
import { obtenerMuroPaginado } from "@/services/mensajes";

export async function GET(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await context.params;
    const { searchParams } = new URL(request.url);
    const limite = Number(searchParams.get("limite") ?? "20");
    const cursor = searchParams.get("cursor");

    const datos = await obtenerMuroPaginado("uid-invitado", {
      filtroUid: uid,
      incluirOcultos: false,
      limite: Number.isFinite(limite) ? limite : 20,
      cursor,
    });

    return NextResponse.json(datos, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/perfil/[uid]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}