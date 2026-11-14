import { NextResponse } from "next/server";
import { mensajeSchema } from "@/schemas/mensaje";

type Mensaje = { id: string; nombre: string; texto: string; creadoEn: string };

const mensajes: Mensaje[] = [
  { id: "1", nombre: "Ana", texto: "¡Bienvenidos al muro!", creadoEn: new Date().toISOString() },
  { id: "2", nombre: "Luis", texto: "Hoy toca entregar el hito 1.", creadoEn: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ items: mensajes, siguienteCursor: null });
}

export async function POST(request: Request) {
  const cuerpo = await request.json().catch(() => null);
  const resultado = mensajeSchema.safeParse(cuerpo);

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

  const nuevo: Mensaje = {
    id: crypto.randomUUID(),
    nombre: "Invitado",
    texto: resultado.data.texto,
    creadoEn: new Date().toISOString(),
  };
  mensajes.unshift(nuevo);
  return NextResponse.json(nuevo, { status: 201 });
}