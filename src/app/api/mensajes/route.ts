import { NextResponse } from "next/server";
import {
  ErrorHttp,
  obtenerUsuarioOpcional,
  requerirUsuario,
} from "@/lib/auth";
import { obtenerMuroPaginado, publicarMensaje } from "@/services/mensajes";

export async function GET(request: Request) {
  try {
    const usuario = await obtenerUsuarioOpcional(request);
    const { searchParams } = new URL(request.url);
    const filtroUid = searchParams.get("uid") ?? undefined;
    const limite = Number(searchParams.get("limite") ?? "20");
    const cursor = searchParams.get("cursor");

    const datos = await obtenerMuroPaginado(usuario?.uid ?? "anonimo", {
      filtroUid,
      incluirOcultos: false,
      soloRaiz: !filtroUid,
      limite: Number.isFinite(limite) ? limite : 20,
      cursor,
    });

    return NextResponse.json(datos, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/mensajes:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los mensajes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const usuario = await requerirUsuario(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const resultado = await publicarMensaje({
      texto: body.texto,
      uid: usuario.uid,
      nombre: usuario.nombre,
      respuestaA: typeof body.respuestaA === "string" ? body.respuestaA : null,
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
    console.error("Error en POST /api/mensajes:", error);
    return NextResponse.json(
      { error: "No se pudo publicar el mensaje" },
      { status: 500 },
    );
  }
}