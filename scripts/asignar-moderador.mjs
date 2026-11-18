import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const env = fs.readFileSync(".env.local", "utf8");
const getVar = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n") : "";
};

initializeApp({
  credential: cert({
    projectId: getVar("FIREBASE_PROJECT_ID"),
    clientEmail: getVar("FIREBASE_CLIENT_EMAIL"),
    privateKey: getVar("FIREBASE_PRIVATE_KEY"),
  }),
});

const correo = process.argv[2];
if (!correo) {
  console.error("Uso: node scripts/asignar-moderador.mjs tu-correo@ejemplo.com");
  process.exit(1);
}

const auth = getAuth();
const user = await auth.getUserByEmail(correo);
await auth.setCustomUserClaims(user.uid, { rol: "moderador" });
console.log(`¡Rol 'moderador' asignado correctamente a ${correo} (${user.uid})!`);