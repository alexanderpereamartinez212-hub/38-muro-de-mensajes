"use client";

import { useState } from "react";
import { MAX_CARACTERES, mensajeSchema } from "@/schemas/mensaje";

type Props = {
  etiqueta: string;
  textoBoton: string;
  alEnviar: (texto: string) => Promise<string | null>;
};

export default function FormularioMensaje({
  etiqueta,
  textoBoton,
  alEnviar,
}: Props) {
  const [texto, setTexto] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  const restantes = MAX_CARACTERES - texto.length;
  const excedido = restantes < 0;
  const errorVisible = excedido
    ? `Te pasaste por ${-restantes} caracteres (máximo ${MAX_CARACTERES})`
    : errorForm;

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = mensajeSchema.safeParse({ texto });
    if (!resultado.success) {
      setErrorForm(resultado.error.issues[0].message);
      return;
    }
    setEnviando(true);
    setErrorForm("");
    const error = await alEnviar(resultado.data.texto);
    setEnviando(false);
    if (error) {
      setErrorForm(error);
      return;
    }
    setTexto("");
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label htmlFor="texto-formulario">{etiqueta}</label>
      <textarea
        id="texto-formulario"
        rows={3}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setErrorForm("");
        }}
        aria-invalid={errorVisible ? true : undefined}
        aria-describedby="contador-formulario error-formulario"
      />
      <p id="contador-formulario" aria-live="polite">
        {restantes} caracteres restantes
      </p>
      <p id="error-formulario" role="alert">
        {errorVisible}
      </p>
      <button type="submit" disabled={enviando || excedido}>
        {enviando ? "Enviando…" : textoBoton}
      </button>
    </form>
  );
}