import MuroDeMensajes from "@/components/MuroDeMensajes";

export default function Home() {
  return (
    <>
      <h1>Muro de mensajes</h1>
      <div className="muro">
        <MuroDeMensajes />
      </div>
    </>
  );
}