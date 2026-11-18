import { NextResponse } from "next/server";
import { z } from "zod";
import { ErrorHttp, requerirModerador } from "@/lib/auth";
import { moderarMensaje, moderarUsuario } from "@/services/mensajes";

const moderacionSchema = z
  .object({
    oculto: z.boolean().optional(),
    uidUsuario: z.string().min(1).optional(),
    minutosBloqueo: z.number().int().min(0).max(43200).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requerirModerador(request);
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = moderacionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de moderación inválidos",
          detalles: parsed.error.issues.map((i) => ({
            campo: i.path.join("."),
            mensaje: i.message,
          })),
        },
        { status: 400 },
      );
    }

    if (typeof parsed.data.oculto === "boolean") {
      const res = await moderarMensaje(id, parsed.data.oculto);
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: res.status });
      }
    }

    if (
      parsed.data.uidUsuario &&
      typeof parsed.data.minutosBloqueo === "number"
    ) {
      await moderarUsuario(parsed.data.uidUsuario, parsed.data.minutosBloqueo);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error en PATCH /api/moderacion/mensajes/[id]:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}