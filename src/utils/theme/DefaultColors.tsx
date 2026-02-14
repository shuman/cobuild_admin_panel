import { createTheme } from "@mui/material/styles";
import { Plus_Jakarta_Sans } from "next/font/google";

export const plus = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

const baselightTheme = createTheme({
  direction: "ltr",
  palette: {
    primary: {
      main: "#5D87FF",
      light: "#ECF2FF",
      dark: "#4570EA",
    },
    secondary: {
      main: "#49BEFF",
      light: "#E8F7FF",
      dark: "#23afdb",
    },
    success: {
      main: "#13DEB9",
      light: "#E6FFFA",
      dark: "#02b3a9",
      contrastText: "#ffffff",
    },
    info: {
      main: "#539BFF",
      light: "#EBF3FE",
      dark: "#1682d4",
      contrastText: "#ffffff",
    },
    error: {
      main: "#FA896B",
      light: "#FDEDE8",
      dark: "#f3704d",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FFAE1F",
      light: "#FEF5E5",
      dark: "#ae8e59",
      contrastText: "#ffffff",
    },
    grey: {
      100: "#F2F6FA",
      200: "#EAEFF4",
      300: "#DFE5EF",
      400: "#7C8FAC",
      500: "#5A6A85",
      600: "#2A3547",
    },
    text: {
      primary: "#2A3547",
      secondary: "#5A6A85",
    },
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "#f6f9fc",
    },
    divider: "#e5eaef",
  },
  typography: {
    fontFamily: plus.style.fontFamily,
    h1: { fontWeight: 600, fontSize: "2.25rem", lineHeight: "2.75rem" },
    h2: { fontWeight: 600, fontSize: "1.875rem", lineHeight: "2.25rem" },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.3125rem", lineHeight: "1.6rem" },
    h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: "1.6rem" },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: "1.2rem" },
    button: { textTransform: "capitalize", fontWeight: 400 },
    body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: "1.334rem" },
    body2: { fontSize: "0.75rem", letterSpacing: "0rem", fontWeight: 400, lineHeight: "1rem" },
    subtitle1: { fontSize: "0.875rem", fontWeight: 400 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 400 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ".MuiPaper-elevation9, .MuiPopover-root .MuiPaper-elevation": {
          boxShadow:
            "rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px !important",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: "7px" },
      },
    },
  },
});

const basedarkTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "dark",
    primary: {
      main: "#5D87FF",
      light: "#253662",
      dark: "#4570EA",
    },
    secondary: {
      main: "#49BEFF",
      light: "#1C455D",
      dark: "#23afdb",
    },
    success: {
      main: "#13DEB9",
      light: "#1B3C48",
      dark: "#02b3a9",
      contrastText: "#ffffff",
    },
    info: {
      main: "#539BFF",
      light: "#223662",
      dark: "#1682d4",
      contrastText: "#ffffff",
    },
    error: {
      main: "#FA896B",
      light: "#4B313D",
      dark: "#f3704d",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FFAE1F",
      light: "#4D3A2A",
      dark: "#ae8e59",
      contrastText: "#ffffff",
    },
    grey: {
      100: "#333F55",
      200: "#465670",
      300: "#7C8FAC",
      400: "#DFE5EF",
      500: "#EAEFF4",
      600: "#F2F6FA",
    },
    text: {
      primary: "#EAEFF4",
      secondary: "#7C8FAC",
    },
    background: {
      default: "#2A3447",
      paper: "#2A3447",
    },
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "rgba(0,0,0,0.05)",
    },
    divider: "#333F55",
  },
  typography: {
    fontFamily: plus.style.fontFamily,
    h1: { fontWeight: 600, fontSize: "2.25rem", lineHeight: "2.75rem" },
    h2: { fontWeight: 600, fontSize: "1.875rem", lineHeight: "2.25rem" },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.3125rem", lineHeight: "1.6rem" },
    h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: "1.6rem" },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: "1.2rem" },
    button: { textTransform: "capitalize", fontWeight: 400 },
    body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: "1.334rem" },
    body2: { fontSize: "0.75rem", letterSpacing: "0rem", fontWeight: 400, lineHeight: "1rem" },
    subtitle1: { fontSize: "0.875rem", fontWeight: 400 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 400 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ".MuiPaper-elevation9, .MuiPopover-root .MuiPaper-elevation": {
          boxShadow:
            "rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px !important",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: "7px" },
      },
    },
  },
});

export { baselightTheme, basedarkTheme };
