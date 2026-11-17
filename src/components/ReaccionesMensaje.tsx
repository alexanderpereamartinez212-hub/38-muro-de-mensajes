"use client";

import { useOptimistic, useState, useTransition } from "react";
import { EMOJIS } from "@/services/reacciones";

type Estado = { propia: string | null; conteo: Record<string, number> };

function aplicar(estado: Estado, emoji: string): Estado {
  const conteo = { ...estado.conteo };
  if (estado.propia === emoji) {
    conteo[emoji] = Math.max((conteo[emoji] ?? 1) - 1, 0);
    return { propia: null, conteo };
  }
  if (estado.propia) {
    conteo[estado.propia] = Math.max((conteo[estado.propia] ?? 1) - 1, 0);
  }
  conteo[emoji] = (conteo[emoji] ?? 0) + 1;
  return { propia: emoji, conteo };
}

type Props = {
  id: string;
  conteoInicial: Record<string, number>;
  propiaInicial: string | null;
};

export default function ReaccionesMensaje({
  id,
  conteoInicial,
  propiaInicial,
}: Props) {
  const [base, setBase] = useState<Estado>({
    propia: propiaInicial,
    conteo: conteoInicial,
  });
  const [optimista, aplicarOptimista] = useOptimistic(base, aplicar);
  const [, iniciar] = useTransition();
  const [error, setError] = useState("");

  function reaccionar(emoji: string) {
    iniciar(async () => {
      aplicarOptimista(emoji);
      try {
        const resp = await fetch(`/api/mensajes/${id}/reaccion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!resp.ok) throw new Error("fallo");
        const datos = await resp.json();
        setBase({ propia: datos.reaccionPropia, conteo: datos.conteo });
        setError("");
      } catch {
        setError("No se pudo reaccionar.");
      }
    });
  }

  return (
    <div className="reacciones" role="group" aria-label="Reacciones">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-pressed={optimista.propia === emoji}
          aria-label={`Reaccionar con ${emoji}`}
          onClick={() => reaccionar(emoji)}
        >
          {emoji} {optimista.conteo[emoji] ?? 0}
        </button>
      ))}
      <span role="status">{error}</span>
    </div>
  );
}