import Link from "next/link";
import DetalleMensaje from "@/components/DetalleMensaje";

export default async function PaginaMensaje({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <p>
        <Link href="/">← Volver al muro</Link>
      </p>
      <h1>Mensaje</h1>
      <DetalleMensaje id={id} />
    </>
  );
}