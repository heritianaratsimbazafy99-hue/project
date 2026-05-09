import type { Metadata, Viewport } from "next";

import "../styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobMada — L'emploi à Madagascar",
  description: "Jobboard et marketplace recrutement pour Madagascar."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
