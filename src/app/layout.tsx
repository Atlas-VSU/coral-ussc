"use client";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const montserrat = localFont({
  src: "./fonts/Montserrat-Latin.woff2",
  variable: "--font-montserrat",
  weight: "200 900",
  style: "normal",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>USSC Connect</title>
        <meta
          name="description"
          content="Your platform for modern productivity and collaboration"
        />
        <link rel="icon" href="/images/ussc-logo-1.webp" />
        <link rel="apple-touch-icon" href="/images/enhanced-logo-final.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${montserrat.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader  
          color="var(--accent)"
          shadow="0 0 10px var(--accent), 0 0 5px var(--accent)"
        />
        <div suppressHydrationWarning style={{ display: "contents" }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
          <Toaster position="top-right" expand={false} richColors closeButton />
        </div>
      </body>
    </html>
  );
}
