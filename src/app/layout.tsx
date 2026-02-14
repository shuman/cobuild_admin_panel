"use client";
import { useState, useMemo, useEffect, createContext, useContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { baselightTheme, basedarkTheme } from "@/utils/theme/DefaultColors";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./global.css";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () => (mode === "light" ? baselightTheme : basedarkTheme),
    [mode]
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>
          <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {mounted && <Toaster position="top-right" richColors />}
              {children}
            </ThemeProvider>
          </ThemeContext.Provider>
        </SessionProvider>
      </body>
    </html>
  );
}
