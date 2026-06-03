import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MediumShip CMS",
  description: "Internal editorial control room for MediumShip.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
