import { NextResponse } from "next/server";
import { ErrorHttp, requerirModerador } from "@/lib/auth";
import { obtenerMuroPaginado } from "@/services/mensajes";

export async function GET(request: Request) {
  try {
    const moderador = await requerirModerador(request);
    const datos = await obtenerMuroPaginado(moderador.uid, {
      incluirOcultos: true,
      soloRaiz: false,
      limite: 100,
    });

    return NextResponse.json(datos, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error en GET /api/moderacion/mensajes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}