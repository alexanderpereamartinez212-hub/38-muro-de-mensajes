export type Mensaje = {
  id: string;
  uid: string;
  nombre: string;
  texto: string;
  respuestaA: string | null;
  creadoEn: string;
};

const global = globalThis as unknown as { __mensajes?: Mensaje[] };

if (!global.__mensajes) {
  global.__mensajes = [
    {
      id: "1",
      uid: "uid-ana",
      nombre: "Ana",
      texto: "¡Bienvenidos al muro!",
      respuestaA: null,
      creadoEn: new Date().toISOString(),
    },
    {
      id: "2",
      uid: "uid-luis",
      nombre: "Luis",
      texto: "Hoy toca entregar el hito 1.",
      respuestaA: null,
      creadoEn: new Date().toISOString(),
    },
    {
      id: "3",
      uid: "uid-luis",
      nombre: "Luis",
      texto: "¡Gracias, Ana!",
      respuestaA: "1",
      creadoEn: new Date().toISOString(),
    },
  ];
}

export const mensajes: Mensaje[] = global.__mensajes;