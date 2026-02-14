"use client";
import React, { Suspense } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
} from "@mui/material";
import TwoFactorForm from "@/components/auth/TwoFactorForm";

function VerifyContent() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: (theme) => theme.palette.grey[100],
        p: 2,
      }}
    >
      <Card elevation={9} sx={{ width: "100%", maxWidth: 460, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="primary" textAlign="center">
              Two-Factor Authentication
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" textAlign="center">
              Enter the 6-digit code from your authenticator app
            </Typography>
          </Stack>

          <TwoFactorForm />

          <Typography
            variant="caption"
            color="textSecondary"
            textAlign="center"
            display="block"
            sx={{ mt: 3 }}
          >
            Having trouble? Use the email fallback option below.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
