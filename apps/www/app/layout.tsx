import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Mediumship — votre app mobile éditoriale",
  description:
    "Studio d'apps mobiles white-label pour médias et créateurs. Transformez votre audience en média propriétaire : iOS et Android sous votre marque, du brief au store en 14 jours.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Hanken+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
