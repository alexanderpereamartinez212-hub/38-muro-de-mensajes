import { NextResponse } from "next/server";
import { obtenerUsuarioOpcional } from "@/lib/auth";

export async function GET(request: Request) {
  const usuario = await obtenerUsuarioOpcional(request);
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json(
    { usuario },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}