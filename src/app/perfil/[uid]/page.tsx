import Link from "next/link";
import PerfilMensajes from "@/components/PerfilMensajes";

export default async function PaginaPerfil({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  return (
    <>
      <p>
        <Link href="/">← Volver al muro</Link>
      </p>
      <h1>Mensajes de esta persona</h1>
      <PerfilMensajes uid={uid} />
    </>
  );
}