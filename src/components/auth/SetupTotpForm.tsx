"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { IconShieldCheck, IconShieldOff } from "@tabler/icons-react";
import api from "@/lib/api";

const steps = ["Generate Secret", "Scan QR Code", "Verify & Enable"];

export default function SetupTotpForm() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<{
    is_enabled: boolean;
    enabled_at: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup state
  const [activeStep, setActiveStep] = useState(0);
  const [secret, setSecret] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState("");

  // Disable state
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get("/2fa/status", {
        headers: {
          Authorization: `Bearer ${session?.apiToken}`,
        },
      });
      setStatus(response.data);
    } catch (err) {
      console.error("Failed to fetch 2FA status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSetupLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/2fa/setup",
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        setSecret(response.data.secret);
        setQrUri(response.data.qr_uri);
        setActiveStep(1);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to set up 2FA";
      setError(message);
      toast.error(message);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/2fa/enable",
        { code: verifyCode },
        {
          headers: {
            Authorization: `Bearer ${session?.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("2FA has been enabled successfully!");
        setActiveStep(0);
        setSecret("");
        setQrUri("");
        setVerifyCode("");
        fetchStatus();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid code";
      setError(message);
      toast.error(message);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/2fa/disable",
        { code: disableCode },
        {
          headers: {
            Authorization: `Bearer ${session?.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("2FA has been disabled");
        setDisableCode("");
        setShowDisable(false);
        fetchStatus();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid code";
      setError(message);
      toast.error(message);
    } finally {
      setDisableLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2FA is already enabled
  if (status?.is_enabled) {
    return (
      <Card elevation={9}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: "success.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconShieldCheck size={24} color="#13DEB9" />
            </Box>
            <Box>
              <Typography variant="h5">2FA is Enabled</Typography>
              <Typography variant="body2" color="textSecondary">
                Your account is protected with two-factor authentication.
                {status.enabled_at &&
                  ` Enabled on ${new Date(status.enabled_at).toLocaleDateString()}`}
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {!showDisable ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<IconShieldOff size={18} />}
              onClick={() => setShowDisable(true)}
            >
              Disable 2FA
            </Button>
          ) : (
            <Box component="form" onSubmit={handleDisable}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your current authenticator code to disable 2FA:
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) =>
                    setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputProps={{ maxLength: 6 }}
                  sx={{ width: 160 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  disabled={disableLoading || disableCode.length !== 6}
                >
                  {disableLoading ? <CircularProgress size={20} /> : "Confirm Disable"}
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode("");
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // 2FA setup flow
  return (
    <Card elevation={9}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "warning.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconShieldOff size={24} color="#FFAE1F" />
          </Box>
          <Box>
            <Typography variant="h5">2FA is Not Enabled</Typography>
            <Typography variant="body2" color="textSecondary">
              Set up two-factor authentication to secure your account.
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleSetup}
            disabled={setupLoading}
            sx={{ mt: 1 }}
          >
            {setupLoading ? <CircularProgress size={20} /> : "Begin Setup"}
          </Button>
        )}

        {activeStep >= 1 && (
          <Box>
            <Stepper activeStep={activeStep - 1} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 1 && (
              <Stack alignItems="center" spacing={3}>
                <Typography variant="body1" textAlign="center">
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </Typography>

                <Box
                  sx={{
                    p: 3,
                    backgroundColor: "white",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <QRCodeSVG value={qrUri} size={200} />
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="textSecondary">
                    Or enter this code manually:
                  </Typography>
                  <Chip
                    label={secret}
                    variant="outlined"
                    sx={{
                      mt: 1,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      letterSpacing: "2px",
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  onClick={() => setActiveStep(2)}
                >
                  I&apos;ve Scanned the Code
                </Button>
              </Stack>
            )}

            {activeStep === 2 && (
              <Box component="form" onSubmit={handleEnable}>
                <Stack alignItems="center" spacing={3}>
                  <Typography variant="body1" textAlign="center">
                    Enter the 6-digit code from your authenticator app to verify
                    and enable 2FA.
                  </Typography>

                  <TextField
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    inputProps={{
                      maxLength: 6,
                      style: {
                        textAlign: "center",
                        fontSize: "1.5rem",
                        letterSpacing: "0.5rem",
                        fontFamily: "monospace",
                      },
                    }}
                    sx={{ width: 200 }}
                    autoFocus
                  />

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="text"
                      onClick={() => setActiveStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={setupLoading || verifyCode.length !== 6}
                    >
                      {setupLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Enable 2FA"
                      )}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
