import { NextResponse } from "next/server";
import { z } from "zod";
import { mensajes } from "@/lib/almacen";
import { reacciones } from "@/lib/reacciones";
import { EMOJIS, alternarReaccion, contar } from "@/services/reacciones";

const esquema = z.strictObject({ emoji: z.enum(EMOJIS) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mensajes.some((m) => m.id === id)) {
    return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }

  const resultado = esquema.safeParse(await request.json().catch(() => null));
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

  const uid = "uid-invitado";
  let porUsuario = reacciones.get(id);
  if (!porUsuario) {
    porUsuario = new Map();
    reacciones.set(id, porUsuario);
  }

  const nueva = alternarReaccion(porUsuario.get(uid), resultado.data.emoji);
  if (nueva) {
    porUsuario.set(uid, nueva);
  } else {
    porUsuario.delete(uid);
  }

  return NextResponse.json({
    reaccionPropia: nueva ?? null,
    conteo: contar(porUsuario),
  });
}
