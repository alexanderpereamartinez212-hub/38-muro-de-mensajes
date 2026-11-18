import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";
import {
  DURACION_SESION_MS,
  ErrorHttp,
  NOMBRE_COOKIE_SESION,
  obtenerUsuarioOpcional,
  verificarOrigen,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    verificarOrigen(request);
    const body = await request.json().catch(() => null);
    const idToken = typeof body?.idToken === "string" ? body.idToken : "";

    if (!idToken) {
      return NextResponse.json(
        { error: "Falta el idToken de Firebase" },
        { status: 400 },
      );
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);

    // Exigir inicio de sesión reciente (máximo 5 minutos)
    const ahoraSeg = Math.floor(Date.now() / 1000);
    if (ahoraSeg - decoded.auth_time > 5 * 60) {
      return NextResponse.json(
        { error: "El inicio de sesión no es reciente. Vuelve a ingresar." },
        { status: 401 },
      );
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: DURACION_SESION_MS,
    });

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(NOMBRE_COOKIE_SESION, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(DURACION_SESION_MS / 1000),
    });

    return response;
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "No se pudo crear la sesión" },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    verificarOrigen(request);
    const usuario = await obtenerUsuarioOpcional(request);
    if (usuario) {
      await getAuth().revokeRefreshTokens(usuario.uid).catch(() => {});
    }

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(NOMBRE_COOKIE_SESION, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    if (error instanceof ErrorHttp) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}