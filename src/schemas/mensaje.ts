import { z } from "zod";

export const MAX_CARACTERES = 280;

export const mensajeSchema = z.strictObject({
  texto: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje")
    .max(MAX_CARACTERES, "Máximo 280 caracteres"),
});

export type NuevoMensaje = z.infer<typeof mensajeSchema>;