"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import SetupTotpForm from "@/components/auth/SetupTotpForm";

export default function Setup2FAPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Two-Factor Authentication
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Enhance your account security by enabling two-factor authentication.
        Once enabled, you will need to enter a code from your authenticator app
        every time you log in.
      </Typography>
      <SetupTotpForm />
    </Box>
  );
}
