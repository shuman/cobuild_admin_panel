"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled, TextField } from "@mui/material";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-input::-webkit-input-placeholder": {
    color: theme.palette.text.secondary,
    opacity: "0.8",
  },
}));

function parse2FAError(value: string): { two_fa_token: string } | null {
  try {
    const decoded = decodeURIComponent(value);
    const data = JSON.parse(decoded);
    if (data?.requires_2fa && data?.two_fa_token) {
      return { two_fa_token: data.two_fa_token };
    }
  } catch {
    // not our 2FA payload
  }
  return null;
}

/** Encode token + user for __direct_login__ (base64 to avoid colons/special chars) */
function encodeDirectLoginPayload(token: string, user: object): string {
  const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
  return `${b64(token)}.${b64(JSON.stringify(user))}`;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If NextAuth redirected to /login?error=... with our 2FA JSON, redirect to verify-2fa
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (!errorParam) return;
    const twoFa = parse2FAError(errorParam);
    if (twoFa) {
      router.replace(
        `/verify-2fa?token=${encodeURIComponent(twoFa.two_fa_token)}`
      );
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call backend login from client first so we can handle 2FA without relying on NextAuth error passing
      const response = await api.post("/login", {
        login: email,
        password,
      });

      const data = response.data as Record<string, unknown>;

      if (data.requires_2fa === true && data.two_fa_token) {
        router.push(
          `/verify-2fa?token=${encodeURIComponent(String(data.two_fa_token))}`
        );
        return;
      }

      const items = data.items as { user?: Record<string, unknown>; token?: string } | undefined;
      if (items?.token && items?.user) {
        const fullUser = items.user;
        if (!fullUser?.is_super_admin) {
          setError("Access denied. SuperAdmin privileges required.");
          toast.error("Access denied");
          return;
        }
        const payload = encodeDirectLoginPayload(items.token, fullUser);
        const result = await signIn("credentials", {
          email: "__direct_login__",
          password: payload,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
        } else if (result?.ok) {
          toast.success("Login successful");
          router.push("/");
        }
        return;
      }

      setError("Invalid login response");
      toast.error("Login failed");
    } catch (err: unknown) {
      const res = (err as { response?: { data?: Record<string, unknown>; status?: number } })?.response;
      const data = res?.data;

      if (data?.requires_2fa === true && data?.two_fa_token) {
        router.push(
          `/verify-2fa?token=${encodeURIComponent(String(data.two_fa_token))}`
        );
        return;
      }

      const message =
        (data?.error as string) ||
        (data?.message as string) ||
        "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="email"
            mb="5px"
            display="block"
          >
            Email Address
          </Typography>
          <CustomTextField
            id="email"
            type="email"
            variant="outlined"
            fullWidth
            placeholder="superadmin@cobuildmanager.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </Box>

        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="password"
            mb="5px"
            display="block"
          >
            Password
          </Typography>
          <CustomTextField
            id="password"
            type="password"
            variant="outlined"
            fullWidth
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Box>

        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading || !email || !password}
          sx={{ py: 1.5 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Sign In"
          )}
        </Button>
      </Stack>
    </form>
  );
}
