"use client";
import React from "react";
import { Avatar, Box, Typography, Stack } from "@mui/material";
import { useSession } from "next-auth/react";
import { IconUser } from "@tabler/icons-react";

const Profile = () => {
  const { data: session } = useSession();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar
        sx={{
          width: 35,
          height: 35,
          bgcolor: "primary.main",
        }}
      >
        <IconUser size={20} />
      </Avatar>
      <Stack sx={{ display: { xs: "none", sm: "flex" } }}>
        <Typography variant="subtitle2" fontWeight={600} lineHeight={1.2}>
          {session?.user?.name || "SuperAdmin"}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Super Admin
        </Typography>
      </Stack>
    </Box>
  );
};

export default Profile;
