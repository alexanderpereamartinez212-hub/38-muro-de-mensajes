import { Suspense } from "react";
import Link from "next/link";
import DetalleMensaje from "@/components/DetalleMensaje";

async function ContenidoMensaje({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetalleMensaje id={id} />;
}

export default function PaginaMensaje({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <p>
        <Link href="/">← Volver al muro</Link>
      </p>
      <h1>Mensaje</h1>
      <Suspense fallback={<p role="status">Cargando mensaje…</p>}>
        <ContenidoMensaje params={params} />
      </Suspense>
    </>
  );
}
