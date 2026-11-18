import { NextResponse } from "next/server";
import { ErrorHttp, requerirUsuario } from "@/lib/auth";
import { reportarMensaje } from "@/services/mensajes";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requerirUsuario(request);
    const { id } = await context.params;
    const resultado = await reportarMensaje(id);

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error en POST /api/mensajes/[id]/reportar:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}