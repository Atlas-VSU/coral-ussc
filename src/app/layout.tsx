"use client";
import { Nunito, Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>
          Coral - Centralized Online Record for Attendance and Logging
        </title>
        <meta
          name="description"
          content="Your platform for modern productivity and collaboration"
        />
        <link rel="icon" href="/enhanced-logo-final.svg" />
        <link rel="apple-touch-icon" href="/images/enhanced-logo-final.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${nunito.variable} ${nunitoSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <div suppressHydrationWarning style={{ display: 'contents' }}>
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
          <Toaster 
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
        </div>
      </body>
    </html>
  );
}
