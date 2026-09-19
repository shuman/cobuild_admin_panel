"use client";
import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Button,
  Badge,
  Tooltip,
} from "@mui/material";
import { signOut } from "next-auth/react";
import {
  IconBellRinging,
  IconMenu,
  IconMoon,
  IconSun,
  IconLogout,
  IconDownload,
} from "@tabler/icons-react";
import { useThemeMode } from "@/components/providers/Providers";
import { usePWA } from "@/components/pwa/PWAContext";
import Profile from "./Profile";

interface HeaderProps {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
}

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  boxShadow: "none",
  background: theme.palette.background.paper,
  justifyContent: "center",
  backdropFilter: "blur(4px)",
  borderBottom: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.up("lg")]: {
    minHeight: "70px",
  },
}));

const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
  width: "100%",
  color: theme.palette.text.secondary,
  gap: theme.spacing(0.5),
  [theme.breakpoints.up("sm")]: {
    minHeight: "68px",
  },
}));

const Header = ({ toggleMobileSidebar }: HeaderProps) => {
  const { mode, toggleTheme } = useThemeMode();
  const { isInstallable, isInstalled, isIOS, openPrompt } = usePWA();
  const canInstall = !isInstalled && (isInstallable || isIOS);

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={toggleMobileSidebar}
          sx={{ display: { lg: "none", xs: "inline" } }}
        >
          <IconMenu width="20" height="20" />
        </IconButton>

        <IconButton size="large" color="inherit" aria-label="notifications">
          <Badge variant="dot" color="primary">
            <IconBellRinging size="21" stroke="1.5" />
          </Badge>
        </IconButton>

        <Box flexGrow={1} />

        <Stack spacing={1} direction="row" alignItems="center">
          {canInstall && (
            <>
              <Tooltip title={isIOS ? "Install guide for iOS" : "Install CoBuild App"}>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={openPrompt}
                  startIcon={<IconDownload size={16} />}
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  Install App
                </Button>
              </Tooltip>
              <Tooltip title={isIOS ? "Install guide for iOS" : "Install CoBuild App"}>
                <IconButton
                  color="primary"
                  onClick={openPrompt}
                  sx={{ display: { xs: "inline-flex", sm: "none" } }}
                  aria-label="Install app"
                >
                  <IconDownload size={20} />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === "light" ? (
                <IconMoon size="21" stroke="1.5" />
              ) : (
                <IconSun size="21" stroke="1.5" />
              )}
            </IconButton>
          </Tooltip>

          <Profile />

          <Tooltip title="Logout">
            <IconButton
              color="inherit"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <IconLogout size="21" stroke="1.5" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;
