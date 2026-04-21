import type { Metadata } from "next";
import { Roboto, Sarabun, Karla } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-roboto",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AMYAL CAR - Car Dealership & Rental Management",
  description: "AMYAL CAR - Car Dealership & Rental Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} ${sarabun.variable} ${karla.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}