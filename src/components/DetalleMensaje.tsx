"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormularioMensaje from "./FormularioMensaje";

type Mensaje = {
  id: string;
  uid: string;
  nombre: string;
  texto: string;
  respuestaA: string | null;
  creadoEn: string;
};

type Estado = "cargando" | "listo" | "noEncontrado" | "error";

export default function DetalleMensaje({ id }: { id: string }) {
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [respuestas, setRespuestas] = useState<Mensaje[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    fetch(`/api/mensajes/${id}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (activo) setEstado("noEncontrado");
          return;
        }
        if (!r.ok) throw new Error("Error al cargar");
        const datos = await r.json();
        if (activo) {
          setMensaje(datos.mensaje);
          setRespuestas(datos.respuestas);
          setEstado("listo");
        }
      })
      .catch(() => {
        if (activo) setEstado("error");
      });
    return () => {
      activo = false;
    };
  }, [id, intento]);

  async function responder(texto: string): Promise<string | null> {
    try {
      const resp = await fetch(`/api/mensajes/${id}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      if (!resp.ok) {
        const datos = await resp.json().catch(() => null);
        return datos?.detalles?.[0]?.mensaje ?? datos?.error ?? "No se pudo responder";
      }
      const nueva: Mensaje = await resp.json();
      setRespuestas((previas) => [...previas, nueva]);
      return null;
    } catch {
      return "Sin conexión. Intenta de nuevo.";
    }
  }

  if (estado === "cargando") {
    return <p role="status">Cargando mensaje…</p>;
  }

  if (estado === "noEncontrado") {
    return (
      <div>
        <p>Este mensaje no existe o fue eliminado.</p>
        <Link href="/">Volver al muro</Link>
      </div>
    );
  }

  if (estado === "error" || !mensaje) {
    return (
      <div role="alert">
        <p>No se pudo cargar el mensaje.</p>
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

  return (
    <>
      <article>
        <p>
          <strong>{mensaje.nombre}</strong>{" "}
          <time dateTime={mensaje.creadoEn}>
            {new Date(mensaje.creadoEn).toLocaleString("es")}
          </time>
        </p>
        <p>{mensaje.texto}</p>
      </article>

      <section aria-labelledby="titulo-respuestas">
        <h2 id="titulo-respuestas">Respuestas</h2>
        {respuestas.length === 0 ? (
          <p>Todavía no hay respuestas.</p>
        ) : (
          <ul>
            {respuestas.map((r) => (
              <li key={r.id}>
                <p>
                  <strong>{r.nombre}</strong>{" "}
                  <time dateTime={r.creadoEn}>
                    {new Date(r.creadoEn).toLocaleString("es")}
                  </time>
                </p>
                <p>{r.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FormularioMensaje
        etiqueta="Escribe tu respuesta"
        textoBoton="Responder"
        alEnviar={responder}
      />
    </>
  );
}