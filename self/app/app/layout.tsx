"use client";

import { SwarProvider } from "@/context/SwarProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SwarProvider>{children}</SwarProvider>
      </body>
    </html>
  );
}
