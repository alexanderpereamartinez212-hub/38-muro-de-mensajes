import { NextResponse } from "next/server";
import { ErrorHttp, requerirUsuario } from "@/lib/auth";
import { publicarMensaje } from "@/services/mensajes";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const cuerpo = await request.json().catch(() => ({}));

    const resultado = await publicarMensaje({
      texto: cuerpo?.texto,
      uid: usuario.uid,
      nombre: usuario.nombre,
      respuestaA: id,
    });

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error, detalles: resultado.detalles },
        { status: resultado.status },
      );
    }

    return NextResponse.json(resultado.mensaje, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error en POST /api/mensajes/[id]/respuestas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}