"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { MAX_CARACTERES, mensajeSchema } from "@/schemas/mensaje";
import ReaccionesMensaje from "./ReaccionesMensaje";

type Mensaje = {
  id: string;
  uid: string;
  nombre: string;
  texto: string;
  creadoEn: string;
  conteo?: Record<string, number>;
  reaccionPropia?: string | null;
  pendiente?: boolean;
};
type Estado = "cargando" | "listo" | "error";

function formatearTiempoRelativo(iso: string): string {
  const fecha = new Date(iso);
  if (typeof Intl === "undefined" || typeof Intl.RelativeTimeFormat === "undefined") {
    return fecha.toLocaleString("es");
  }
  const diffSeg = Math.round((fecha.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (Math.abs(diffSeg) < 60) return rtf.format(diffSeg, "second");
  const diffMin = Math.round(diffSeg / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHor = Math.round(diffMin / 60);
  if (Math.abs(diffHor) < 24) return rtf.format(diffHor, "hour");
  const diffDias = Math.round(diffHor / 24);
  return rtf.format(diffDias, "day");
}

export default function MuroDeMensajes() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [siguienteCursor, setSiguienteCursor] = useState<string | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);
  const [texto, setTexto] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [avisoReporte, setAvisoReporte] = useState("");
  const [publicando, iniciar] = useTransition();
  const [visibles, agregarOptimista] = useOptimistic(
    mensajes,
    (previos: Mensaje[], nuevo: Mensaje) => [nuevo, ...previos],
  );

  useEffect(() => {
    let activo = true;
    fetch("/api/mensajes?limite=20")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((datos) => {
        if (activo) {
          setMensajes(datos.items);
          setSiguienteCursor(datos.siguienteCursor ?? null);
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

  async function cargarMas() {
    if (!siguienteCursor || cargandoMas) return;
    setCargandoMas(true);
    try {
      const resp = await fetch(`/api/mensajes?limite=20&cursor=${encodeURIComponent(siguienteCursor)}`);
      if (resp.ok) {
        const datos = await resp.json();
        setMensajes((prev) => [...prev, ...datos.items]);
        setSiguienteCursor(datos.siguienteCursor ?? null);
      }
    } finally {
      setCargandoMas(false);
    }
  }

  function reintentar() {
    setEstado("cargando");
    setIntento((n) => n + 1);
  }

  const restantes = MAX_CARACTERES - texto.length;
  const excedido = restantes < 0;
  const errorVisible = excedido
    ? `Te pasaste por ${-restantes} caracteres (máximo ${MAX_CARACTERES})`
    : errorForm;

  function publicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = mensajeSchema.safeParse({ texto });
    if (!resultado.success) {
      setErrorForm(resultado.error.issues[0].message);
      return;
    }
    const textoValido = resultado.data.texto;
    setErrorForm("");

    iniciar(async () => {
      agregarOptimista({
        id: `temp-${Date.now()}`,
        uid: "actual",
        nombre: "Tú",
        texto: textoValido,
        creadoEn: new Date().toISOString(),
        pendiente: true,
      });
      try {
        const resp = await fetch("/api/mensajes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: textoValido }),
        });
        if (!resp.ok) {
          const datos = await resp.json().catch(() => null);
          setErrorForm(
            datos?.detalles?.[0]?.mensaje ?? datos?.error ?? "No se pudo publicar",
          );
          return;
        }
        const nuevo: Mensaje = await resp.json();
        setMensajes((previos) => [nuevo, ...previos]);
        setTexto("");
      } catch {
        setErrorForm("Sin conexión. Intenta de nuevo.");
      }
    });
  }

  async function reportar(id: string) {
    setAvisoReporte("");
    const resp = await fetch(`/api/mensajes/${id}/reportar`, { method: "POST" });
    if (resp.ok) {
      setAvisoReporte("Mensaje reportado al equipo de moderación.");
    } else if (resp.status === 401) {
      setAvisoReporte("Inicia sesión para reportar mensajes.");
    } else {
      setAvisoReporte("No se pudo enviar el reporte.");
    }
  }

  return (
    <>
      <form onSubmit={publicar} noValidate>
        <label htmlFor="texto">Escribe tu mensaje</label>
        <textarea
          id="texto"
          name="texto"
          rows={3}
          maxLength={MAX_CARACTERES + 50}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setErrorForm("");
          }}
          aria-invalid={errorVisible ? true : undefined}
          aria-describedby="contador error-texto"
        />
        <p id="contador" aria-live="polite">
          {restantes} caracteres restantes
        </p>
        <p id="error-texto" role="alert">
          {errorVisible}
        </p>
        <button type="submit" disabled={publicando || excedido}>
          {publicando ? "Publicando…" : "Publicar"}
        </button>
      </form>

      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista">Mensajes</h2>

        {avisoReporte && (
          <p role="status" aria-live="polite">
            {avisoReporte}
          </p>
        )}

        {estado === "cargando" && <p role="status">Cargando mensajes…</p>}

        {estado === "error" && (
          <div role="alert">
            <p>No se pudieron cargar los mensajes.</p>
            <button type="button" onClick={reintentar}>
              Reintentar
            </button>
          </div>
        )}

        {estado === "listo" && visibles.length === 0 && (
          <p>Todavía no hay mensajes. ¡Sé la primera persona en escribir!</p>
        )}

        {estado === "listo" && visibles.length > 0 && (
          <>
            <ul>
              {visibles.map((m) => (
                <li key={m.id}>
                  <p>
                    <strong>
                      <Link href={`/perfil/${m.uid}`}>{m.nombre}</Link>
                    </strong>{" "}
                    <time dateTime={m.creadoEn} title={new Date(m.creadoEn).toLocaleString("es")}>
                      {formatearTiempoRelativo(m.creadoEn)}
                    </time>
                    {m.pendiente && <em> · Publicando…</em>}
                  </p>
                  <p>{m.texto}</p>
                  {!m.pendiente && (
                    <>
                      <ReaccionesMensaje
                        id={m.id}
                        conteoInicial={m.conteo ?? {}}
                        propiaInicial={m.reaccionPropia ?? null}
                      />
                      <p style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <Link href={`/mensajes/${m.id}`}>Ver respuestas</Link>
                        <button type="button" onClick={() => reportar(m.id)}>
                          Reportar
                        </button>
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {siguienteCursor && (
              <p>
                <button type="button" onClick={cargarMas} disabled={cargandoMas}>
                  {cargandoMas ? "Cargando más…" : "Cargar más mensajes"}
                </button>
              </p>
            )}
          </>
        )}
      </section>
    </>
  );
}