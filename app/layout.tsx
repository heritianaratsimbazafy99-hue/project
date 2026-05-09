import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "JobMada — L'emploi à Madagascar",
  description: "Jobboard et marketplace recrutement pour Madagascar."
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
