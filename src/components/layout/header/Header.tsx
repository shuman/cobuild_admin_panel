"use client";
import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Badge,
  Tooltip,
} from "@mui/material";
import { useSession, signOut } from "next-auth/react";
import {
  IconBellRinging,
  IconMenu,
  IconMoon,
  IconSun,
  IconLogout,
} from "@tabler/icons-react";
import { useThemeMode } from "@/app/layout";
import Profile from "./Profile";

interface HeaderProps {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
}

const Header = ({ toggleMobileSidebar }: HeaderProps) => {
  const { mode, toggleTheme } = useThemeMode();

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: "none",
    background: theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    [theme.breakpoints.up("lg")]: {
      minHeight: "70px",
    },
  }));

  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    color: theme.palette.text.secondary,
  }));

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
