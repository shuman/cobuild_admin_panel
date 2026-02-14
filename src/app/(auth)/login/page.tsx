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
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
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
      <Card
        elevation={9}
        sx={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              color="primary"
              textAlign="center"
            >
              CoBuild Manager
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              SuperAdmin Portal
            </Typography>
          </Stack>

          <Suspense
            fallback={
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            }
          >
            <LoginForm />
          </Suspense>

          {/* Footer */}
          <Typography
            variant="caption"
            color="textSecondary"
            textAlign="center"
            display="block"
            sx={{ mt: 3 }}
          >
            Only authorized SuperAdmin accounts can access this portal.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
