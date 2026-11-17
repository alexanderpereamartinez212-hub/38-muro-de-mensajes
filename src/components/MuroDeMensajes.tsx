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

export default function MuroDeMensajes() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);
  const [texto, setTexto] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [publicando, iniciar] = useTransition();
  const [visibles, agregarOptimista] = useOptimistic(
    mensajes,
    (previos: Mensaje[], nuevo: Mensaje) => [nuevo, ...previos],
  );

  useEffect(() => {
    let activo = true;
    fetch("/api/mensajes")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((datos) => {
        if (activo) {
          setMensajes(datos.items);
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
        uid: "uid-invitado",
        nombre: "Invitado",
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

  return (
    <>
      <form onSubmit={publicar} noValidate>
        <label htmlFor="texto">Escribe tu mensaje</label>
        <textarea
          id="texto"
          name="texto"
          rows={3}
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
          <ul>
            {visibles.map((m) => (
              <li key={m.id}>
                <p>
                  <strong>
                    <Link href={`/perfil/${m.uid}`}>{m.nombre}</Link>
                  </strong>{" "}
                  <time dateTime={m.creadoEn}>
                    {new Date(m.creadoEn).toLocaleString("es")}
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
                    <p>
                      <Link href={`/mensajes/${m.id}`}>Ver respuestas</Link>
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
