import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import ClientLayout from "@/components/ClientLayout";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300","400","500","600","700"] });

export const metadata: Metadata = {
  title: "DJ Brain",
  description: "Advanced DJ Metadata & Music Library",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#06060e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.className} pb-24 min-h-screen flex flex-col`} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
