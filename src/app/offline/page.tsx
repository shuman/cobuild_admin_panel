"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { IconRefresh, IconWifiOff } from "@tabler/icons-react";

export default function OfflinePage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          borderRadius: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: "divider",
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 5 },
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            mx: "auto",
            mb: 2.5,
            bgcolor: (th) => `${th.palette.primary.main}18`,
            color: (th) => th.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWifiOff size={32} />
        </Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, letterSpacing: "-0.01em", mb: 1 }}
        >
          You&rsquo;re offline
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
        >
          Your internet connection seems to be unavailable. Pages you have
          recently visited may still work — reconnect and try again.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<IconRefresh size={18} />}
          onClick={() => window.location.reload()}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Retry
        </Button>
      </Paper>
    </Box>
  );
}
