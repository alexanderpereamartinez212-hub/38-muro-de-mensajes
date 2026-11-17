import { crearLimitador } from "@/services/limiteFrecuencia";

const global = globalThis as unknown as {
  __limitador?: ReturnType<typeof crearLimitador>;
};

if (!global.__limitador) {
  global.__limitador = crearLimitador(5, 60_000);
}

export const permitirPublicar = global.__limitador;
