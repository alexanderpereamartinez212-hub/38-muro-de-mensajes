export function crearLimitador(
  max: number,
  ventanaMs: number,
  ahora: () => number = Date.now,
) {
  const registros = new Map<string, number[]>();

  return function permitir(clave: string): boolean {
    const t = ahora();
    const recientes = (registros.get(clave) ?? []).filter(
      (x) => t - x < ventanaMs,
    );
    if (recientes.length >= max) {
      registros.set(clave, recientes);
      return false;
    }
    recientes.push(t);
    registros.set(clave, recientes);
    return true;
  };
}
