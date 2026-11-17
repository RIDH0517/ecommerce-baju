import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/(store)/context/AuthContext";
import { CartProvider } from "@/app/(store)/context/CartContext";
import CartDrawer from "@/app/(store)/components/CartDrawer";

export const metadata: Metadata = {
  title: "urban.kamen — Streetwear Essentials",
  description: "Modern Streetwear & Lifestyle Brand",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            <CartDrawer />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}