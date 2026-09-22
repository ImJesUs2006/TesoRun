import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import { Toaster } from "@/components/muro/toast";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

export const metadata: Metadata = {
  title: "TesoRun",
  description: "Tesorería gamificada del grupo universitario",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={archivoBlack.variable}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}