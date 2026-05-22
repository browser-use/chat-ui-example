"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SettingsProvider } from "@/context/settings-context";
import { ThemeProvider } from "@/context/theme-context";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
