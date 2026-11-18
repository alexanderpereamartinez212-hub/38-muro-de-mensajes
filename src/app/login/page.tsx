"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { authCliente } from "@/lib/firebaseCliente";

export default function PaginaLogin() {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const credencial = modoRegistro
        ? await createUserWithEmailAndPassword(authCliente, correo.trim(), contrasena)
        : await signInWithEmailAndPassword(authCliente, correo.trim(), contrasena);

      if (modoRegistro && nombre.trim()) {
        await updateProfile(credencial.user, { displayName: nombre.trim() });
      }

      const idToken = await credencial.user.getIdToken(true);
      const resp = await fetch("/api/auth/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        const datos = await resp.json().catch(() => null);
        throw new Error(datos?.error ?? "No se pudo iniciar la sesión en el servidor.");
      }

      window.dispatchEvent(new Event("sesion-cambiada")); router.push("/");
      router.refresh();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error al autenticar. Verifica tus datos.";
      setError(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <p>
        <Link href="/">← Volver al muro</Link>
      </p>
      <h1>{modoRegistro ? "Crear cuenta" : "Iniciar sesión"}</h1>

      <form onSubmit={manejarSubmit}>
        {modoRegistro && (
          <div>
            <label htmlFor="nombre">Nombre para mostrar</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            autoComplete={modoRegistro ? "new-password" : "current-password"}
            minLength={6}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        <p role="alert" aria-live="polite">
          {error}
        </p>

        <button type="submit" disabled={enviando}>
          {enviando
            ? "Procesando…"
            : modoRegistro
              ? "Registrarme"
              : "Entrar"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        <button
          type="button"
          onClick={() => {
            setModoRegistro((v) => !v);
            setError("");
          }}
        >
          {modoRegistro
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Regístrate"}
        </button>
      </p>
    </>
  );
}