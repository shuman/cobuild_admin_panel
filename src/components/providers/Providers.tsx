"use client";
import { useState, useMemo, createContext, useContext, useSyncExternalStore } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { baselightTheme, basedarkTheme } from "@/utils/theme/DefaultColors";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import ThemeRegistry from "@/components/providers/ThemeRegistry";
import { PWAProvider } from "@/components/pwa/PWAContext";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";

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

const emptySubscribe = () => () => {};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () => (mode === "light" ? baselightTheme : basedarkTheme),
    [mode]
  );

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ mode, toggleTheme }}>
        <ThemeRegistry>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <PWAProvider>
              {mounted && <Toaster position="top-right" richColors />}
              {children}
              <PWAInstallBanner />
            </PWAProvider>
          </ThemeProvider>
        </ThemeRegistry>
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
