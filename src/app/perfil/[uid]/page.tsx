import { Suspense } from "react";
import Link from "next/link";
import PerfilMensajes from "@/components/PerfilMensajes";

async function ContenidoPerfil({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  return <PerfilMensajes uid={uid} />;
}

export default function PaginaPerfil({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  return (
    <>
      <p>
        <Link href="/">← Volver al muro</Link>
      </p>
      <h1>Mensajes de esta persona</h1>
      <Suspense fallback={<p role="status">Cargando mensajes…</p>}>
        <ContenidoPerfil params={params} />
      </Suspense>
    </>
  );
}
