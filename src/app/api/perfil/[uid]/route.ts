import { NextResponse } from "next/server";
import { mensajes } from "@/lib/almacen";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const items = mensajes.filter((m) => m.uid === uid);
  return NextResponse.json({ items, siguienteCursor: null });
}