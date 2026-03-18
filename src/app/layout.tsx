import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoDealership - Car Dealership & Rental Management",
  description: "Car Dealership & Rental Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
