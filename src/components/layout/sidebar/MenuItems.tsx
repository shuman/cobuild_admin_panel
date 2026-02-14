import {
  IconLayoutDashboard,
  IconUsers,
  IconBuildingSkyscraper,
  IconShieldLock,
  IconActivity,
  IconSettings,
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
    title: "Settings",
    icon: IconSettings,
    href: "/setup-2fa",
  },
];

export default Menuitems;
