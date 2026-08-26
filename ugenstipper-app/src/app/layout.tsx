import type { Metadata } from "next";
import { Sora, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Ugenstipper",
  description: "Gratis tips på Superligaen med vennerne",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${sora.variable} ${publicSans.variable} ${plexMono.variable} font-body`}
      >
        {children}
      </body>
    </html>
  );
}
