"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { authCliente } from "@/lib/firebaseCliente";

type Usuario = {
  uid: string;
  correo: string;
  nombre: string;
  rol: "usuario" | "moderador" | "admin";
};

export default function BarraSesion() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  const cargarUsuario = useCallback(() => {
    fetch("/api/auth/yo", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        const datos = await r.json();
        return datos.usuario as Usuario;
      })
      .then((u) => {
        setUsuario(u);
        setCargando(false);
      })
      .catch(() => {
        setUsuario(null);
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    cargarUsuario();
    window.addEventListener("sesion-cambiada", cargarUsuario);
    return () => window.removeEventListener("sesion-cambiada", cargarUsuario);
  }, [cargarUsuario]);

  async function cerrarSesion() {
    await signOut(authCliente).catch(() => {});
    await fetch("/api/auth/sesion", { method: "DELETE" }).catch(() => {});
    setUsuario(null);
    window.dispatchEvent(new Event("sesion-cambiada"));
    router.refresh();
  }

  return (
    <nav aria-label="Principal" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
      <Link className="marca" href="/">
        Muro de mensajes
      </Link>

      {!cargando && usuario && (
        <>
          <Link href={`/perfil/${usuario.uid}`}>Mi perfil ({usuario.nombre})</Link>
          {(usuario.rol === "moderador" || usuario.rol === "admin") && (
            <Link href="/moderacion">Moderación</Link>
          )}
          <button type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </>
      )}

      {!cargando && !usuario && (
        <Link href="/login">Iniciar sesión</Link>
      )}
    </nav>
  );
}