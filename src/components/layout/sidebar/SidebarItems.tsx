import React from "react";
import Menuitems from "./MenuItems";
import { Box, Typography, Chip } from "@mui/material";
import {
  Logo,
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
} from "react-mui-sidebar";
import { IconPoint } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const renderMenuItems = (items: any[], pathDirect: string) => {
  return items.map((item: any) => {
    const Icon = item.icon ? item.icon : IconPoint;
    const itemIcon = <Icon stroke={1.5} size="1.3rem" />;

    if (item.subheader) {
      return <Menu subHeading={item.subheader} key={item.subheader} />;
    }

    if (item.disabled) {
      return (
        <Box px={3} key={item.id}>
          <MenuItem
            key={item.id}
            isSelected={false}
            borderRadius="8px"
            icon={itemIcon}
            disabled
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                opacity: 0.5,
              }}
            >
              {item.title}
              <Chip label="Soon" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
            </Box>
          </MenuItem>
        </Box>
      );
    }

    return (
      <Box px={3} key={item.id}>
        <MenuItem
          key={item.id}
          isSelected={pathDirect === item?.href}
          borderRadius="8px"
          icon={itemIcon}
          link={item.href}
          component={Link}
        >
          {item.title}
        </MenuItem>
      </Box>
    );
  });
};

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;

  return (
    <MUI_Sidebar
      width={"100%"}
      showProfile={false}
      themeColor={"#5D87FF"}
      themeSecondaryColor={"#49beff"}
    >
      <Logo img="" component={Link} to="/">
        SuperAdmin
      </Logo>
      {renderMenuItems(Menuitems, pathDirect)}
    </MUI_Sidebar>
  );
};

export default SidebarItems;
