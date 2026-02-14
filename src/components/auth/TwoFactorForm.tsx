"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import { styled, TextField } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import api from "@/lib/api";

const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-input": {
    textAlign: "center",
    fontSize: "1.5rem",
    letterSpacing: "0.5rem",
    fontFamily: "'Courier New', monospace",
  },
}));

export default function TwoFactorForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(
        () => setResendCooldown((prev) => prev - 1),
        1000
      );
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  if (!token) {
    return (
      <Alert severity="error">
        Invalid 2FA session. Please{" "}
        <MuiLink href="/login">log in again</MuiLink>.
      </Alert>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setError("");
    setLoading(true);

    try {
      // Step 1: Verify the OTP code with the backend
      const endpoint = isEmailMode ? "/2fa/verify-email-otp" : "/2fa/verify";
      const response = await api.post(endpoint, { code, token });

      if (response.data.success && response.data.jwt_token) {
        // Step 2: Create NextAuth session with JWT + user (base64 encoded; no colons/JSON in password)
        const jwt = response.data.jwt_token;
        const userStr = JSON.stringify(response.data.user);
        const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
        const password = `${b64(jwt)}.${b64(userStr)}`;
        const result = await signIn("credentials", {
          email: "__2fa_verified__",
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
        } else if (result?.ok) {
          toast.success("Login successful");
          router.push("/");
        }
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Invalid verification code";

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        toast.error("Session expired");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setEmailOtpLoading(true);
    setError("");

    try {
      const response = await api.post("/2fa/send-email-otp", { token });
      if (response.data.success) {
        setEmailOtpSent(true);
        setIsEmailMode(true);
        setCode("");
        setResendCooldown(60);
        toast.success("Verification code sent to your email");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }
      if (err.response?.status === 429) {
        setError("Too many requests. Please try again later.");
        return;
      }
      const message =
        err.response?.data?.message || "Failed to send email OTP";
      setError(message);
      toast.error(message);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {emailOtpSent && !error && (
          <Alert severity="info">
            A 6-digit code has been sent to your email. It expires in 10
            minutes.
          </Alert>
        )}

        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="code"
            mb="5px"
            display="block"
            textAlign="center"
          >
            {isEmailMode ? "Email Verification Code" : "Authenticator Code"}
          </Typography>
          <CustomTextField
            id="code"
            type="text"
            variant="outlined"
            fullWidth
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(val);
            }}
            required
            autoFocus
            inputProps={{
              maxLength: 6,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />
        </Box>

        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading || code.length !== 6}
          sx={{ py: 1.5 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Verify"
          )}
        </Button>

        <Divider>
          <Typography variant="caption" color="textSecondary">
            OR
          </Typography>
        </Divider>

        {!isEmailMode ? (
          <Button
            variant="outlined"
            fullWidth
            onClick={handleSendEmailOtp}
            disabled={emailOtpLoading}
          >
            {emailOtpLoading ? (
              <CircularProgress size={20} />
            ) : (
              "Send Code via Email"
            )}
          </Button>
        ) : (
          <Stack spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleSendEmailOtp}
              disabled={emailOtpLoading || resendCooldown > 0}
            >
              {emailOtpLoading ? (
                <CircularProgress size={20} />
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                "Resend Email Code"
              )}
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={() => {
                setIsEmailMode(false);
                setCode("");
                setError("");
              }}
            >
              Use Authenticator App Instead
            </Button>
          </Stack>
        )}

        <Button
          variant="text"
          color="inherit"
          fullWidth
          onClick={() => router.push("/login")}
          sx={{ mt: 1 }}
        >
          Back to Login
        </Button>
      </Stack>
    </form>
  );
}
