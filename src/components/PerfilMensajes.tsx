"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Mensaje = {
  id: string;
  nombre: string;
  texto: string;
  respuestaA: string | null;
  creadoEn: string;
};

type Estado = "cargando" | "listo" | "error";

export default function PerfilMensajes({ uid }: { uid: string }) {
  const [items, setItems] = useState<Mensaje[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    fetch(`/api/perfil/${uid}`)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((datos) => {
        if (activo) {
          setItems(datos.items);
          setEstado("listo");
        }
      })
      .catch(() => {
        if (activo) setEstado("error");
      });
    return () => {
      activo = false;
    };
  }, [uid, intento]);

  if (estado === "cargando") return <p role="status">Cargando mensajes…</p>;

  if (estado === "error") {
    return (
      <div role="alert">
        <p>No se pudieron cargar los mensajes.</p>
        <button
          type="button"
          onClick={() => {
            setEstado("cargando");
            setIntento((n) => n + 1);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (items.length === 0) return <p>Esta persona todavía no ha escrito mensajes.</p>;

  return (
    <ul>
      {items.map((m) => (
        <li key={m.id}>
          <p>
            <strong>{m.nombre}</strong>{" "}
            <time dateTime={m.creadoEn}>
              {new Date(m.creadoEn).toLocaleString("es")}
            </time>
          </p>
          <p>{m.texto}</p>
          <p>
            <Link href={`/mensajes/${m.respuestaA ?? m.id}`}>Ver conversación</Link>
          </p>
        </li>
      ))}
    </ul>
  );
}