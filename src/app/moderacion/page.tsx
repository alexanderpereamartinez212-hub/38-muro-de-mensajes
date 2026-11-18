"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MensajeMod = {
  id: string;
  uid: string;
  nombre: string;
  texto: string;
  oculto: boolean;
  reportes: number;
  creadoEn: string;
};

type Estado = "cargando" | "listo" | "denegado" | "error";

export default function PaginaModeracion() {
  const [items, setItems] = useState<MensajeMod[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [aviso, setAviso] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    fetch("/api/moderacion/mensajes", { cache: "no-store" })
      .then(async (resp) => {
        if (resp.status === 401 || resp.status === 403) {
          if (activo) setEstado("denegado");
          return;
        }
        if (!resp.ok) throw new Error("Error");
        const datos = await resp.json();
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
  }, [intento]);

  function reintentar() {
    setEstado("cargando");
    setIntento((n) => n + 1);
  }

  async function alternarOculto(m: MensajeMod) {
    setAviso("");
    const resp = await fetch(`/api/moderacion/mensajes/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oculto: !m.oculto }),
    });
    if (resp.ok) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === m.id ? { ...item, oculto: !m.oculto } : item,
        ),
      );
      setAviso(!m.oculto ? "Mensaje ocultado del muro." : "Mensaje restaurado.");
    } else {
      setAviso("No se pudo actualizar el estado del mensaje.");
    }
  }

  async function bloquearAutor(m: MensajeMod, minutos: number) {
    setAviso("");
    const resp = await fetch(`/api/moderacion/mensajes/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidUsuario: m.uid, minutosBloqueo: minutos }),
    });
    if (resp.ok) {
      setAviso(
        minutos > 0
          ? `Usuario ${m.nombre} bloqueado por ${minutos} minutos.`
          : `Bloqueo levantado para ${m.nombre}.`,
      );
    } else {
      setAviso("No se pudo aplicar el bloqueo.");
    }
  }

  return (
    <>
      <p>
        <Link href="/">← Volver al muro</Link>
      </p>
      <h1>Panel de moderación</h1>

      {aviso && (
        <p role="status" aria-live="polite">
          {aviso}
        </p>
      )}

      {estado === "cargando" && <p role="status">Cargando cola de moderación…</p>}

      {estado === "denegado" && (
        <div role="alert">
          <p>Acceso restringido. Necesitas iniciar sesión con rol de moderador.</p>
          <Link href="/login">Ir a iniciar sesión</Link>
        </div>
      )}

      {estado === "error" && (
        <div role="alert">
          <p>Error al cargar los mensajes.</p>
          <button type="button" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      )}

      {estado === "listo" && items.length === 0 && (
        <p>No hay mensajes registrados todavía.</p>
      )}

      {estado === "listo" && items.length > 0 && (
        <ul>
          {items.map((m) => (
            <li key={m.id}>
              <p>
                <strong>{m.nombre}</strong> ({m.uid}) ·{" "}
                <time dateTime={m.creadoEn}>
                  {new Date(m.creadoEn).toLocaleString("es")}
                </time>{" "}
                · <span>Reportes: {m.reportes}</span> ·{" "}
                <strong>{m.oculto ? "[OCULTO]" : "[VISIBLE]"}</strong>
              </p>
              <p>{m.texto}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => alternarOculto(m)}>
                  {m.oculto ? "Restaurar mensaje" : "Ocultar mensaje"}
                </button>
                <button type="button" onClick={() => bloquearAutor(m, 60)}>
                  Bloquear autor (1 h)
                </button>
                <button type="button" onClick={() => bloquearAutor(m, 0)}>
                  Desbloquear autor
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}