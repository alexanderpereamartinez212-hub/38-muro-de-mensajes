import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BarraSesion from "@/components/BarraSesion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muro de mensajes",
  description: "Muro público con mensajes cortos, reacciones y moderación.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        <header className="cabecera">
          <BarraSesion />
        </header>
        <main id="contenido" className="contenido" tabIndex={-1}>
          {children}
        </main>
        <footer className="pie">
          <p>Proyecto 38 · Muro de mensajes con moderación</p>
        </footer>
      </body>
    </html>
  );
}