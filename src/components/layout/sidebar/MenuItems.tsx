import {
  IconLayoutDashboard,
  IconUsers,
  IconBuildingSkyscraper,
  IconShieldLock,
  IconActivity,
  IconSettings,
  IconBrandWebflow,
  IconDatabase,
  IconShield,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "HOME",
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    navlabel: true,
    subheader: "MANAGEMENT",
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUsers,
    href: "/users",
  },
  {
    id: uniqueId(),
    title: "Projects",
    icon: IconBuildingSkyscraper,
    href: "/projects",
  },
  {
    id: uniqueId(),
    title: "Project User Types",
    icon: IconShield,
    href: "/project-user-types",
  },
  {
    id: uniqueId(),
    title: "Default Settings",
    icon: IconSettings,
    href: "/default-settings",
  },
  {
    navlabel: true,
    subheader: "SYSTEM",
  },
  {
    id: uniqueId(),
    title: "Security",
    icon: IconShieldLock,
    href: "#",
    disabled: true,
  },
  {
    id: uniqueId(),
    title: "System Health",
    icon: IconActivity,
    href: "/health",
  },
  {
    id: uniqueId(),
    title: "Databases",
    icon: IconDatabase,
    href: "/databases",
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    href: "/setup-2fa",
  },
  {
    navlabel: true,
    subheader: "DOCS",
  },
  {
    id: uniqueId(),
    title: "WebSocket Events",
    icon: IconBrandWebflow,
    href: "/docs/websocket-events",
  },
];

export default Menuitems;
