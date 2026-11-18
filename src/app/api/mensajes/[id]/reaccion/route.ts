import { NextResponse } from "next/server";
import { ErrorHttp, requerirUsuario } from "@/lib/auth";
import { procesarReaccion } from "@/services/mensajes";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    const resultado = await procesarReaccion(id, usuario.uid, body?.emoji);
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    return NextResponse.json(
      {
        reaccionPropia: resultado.reaccionPropia,
        conteo: resultado.conteo,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error en POST /api/mensajes/[id]/reaccion:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}