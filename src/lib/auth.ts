import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";

export type RolUsuario = "usuario" | "moderador" | "admin";

export type UsuarioAutenticado = {
  uid: string;
  correo: string;
  nombre: string;
  rol: RolUsuario;
};

export const NOMBRE_COOKIE_SESION = "sesion";
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000; // 5 días

export class ErrorHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function verificarOrigen(request: Request): void {
  const metodo = request.method.toUpperCase();
  if (metodo === "GET" || metodo === "HEAD" || metodo === "OPTIONS") return;

  const origin = request.headers.get("origin");
  if (!origin) return; // Peticiones server-to-server o Bruno sin Origin

  const url = new URL(request.url);
  if (origin !== url.origin) {
    throw new ErrorHttp(403, "Origen de solicitud no permitido (CSRF)");
  }
}

function mapearClaims(decoded: Record<string, unknown>): UsuarioAutenticado {
  const uid = String(decoded.uid ?? "");
  const correo = String(decoded.email ?? "");
  const nombre =
    typeof decoded.name === "string" && decoded.name.trim()
      ? decoded.name.trim()
      : correo.split("@")[0] || "Usuario";
  const rolRaw = decoded.rol;
  const rol: RolUsuario =
    rolRaw === "moderador" || rolRaw === "admin" ? rolRaw : "usuario";

  return { uid, correo, nombre, rol };
}

export async function obtenerUsuarioOpcional(
  request?: Request,
): Promise<UsuarioAutenticado | null> {
  const auth = getAuth();

  // 1. Soporta Authorization: Bearer <idToken> (Bruno / Postman / tests)
  const authHeader = request?.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const decoded = await auth.verifyIdToken(token);
        return mapearClaims(decoded);
      } catch {
        return null;
      }
    }
  }

  // 2. Cookie de sesión HttpOnly
  try {
    const cookieStore = await cookies();
    const cookieSesion = cookieStore.get(NOMBRE_COOKIE_SESION)?.value;
    if (!cookieSesion) return null;

    const decoded = await auth.verifySessionCookie(cookieSesion, true);
    return mapearClaims(decoded);
  } catch {
    return null;
  }
}

export async function requerirUsuario(
  request: Request,
): Promise<UsuarioAutenticado> {
  verificarOrigen(request);
  const usuario = await obtenerUsuarioOpcional(request);
  if (!usuario) {
    throw new ErrorHttp(401, "Debes iniciar sesión para realizar esta acción.");
  }
  return usuario;
}

export async function requerirModerador(
  request: Request,
): Promise<UsuarioAutenticado> {
  const usuario = await requerirUsuario(request);
  if (usuario.rol !== "moderador" && usuario.rol !== "admin") {
    throw new ErrorHttp(403, "Se requieren permisos de moderador.");
  }
  return usuario;
}