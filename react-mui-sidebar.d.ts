declare module "react-mui-sidebar" {
  import { ComponentType, ReactNode } from "react";

  export interface SidebarProps {
    width?: string;
    showProfile?: boolean;
    themeColor?: string;
    themeSecondaryColor?: string;
    children?: ReactNode;
  }

  export interface LogoProps {
    img?: string;
    component?: ComponentType<any>;
    to?: string;
    children?: ReactNode;
  }

  export interface MenuProps {
    subHeading?: string;
    children?: ReactNode;
  }

  export interface MenuItemProps {
    icon?: ReactNode;
    link?: string;
    component?: ComponentType<any>;
    isSelected?: boolean;
    borderRadius?: string;
    children?: ReactNode;
    disabled?: boolean;
    [key: string]: any;
  }

  export interface SubmenuProps {
    title?: string;
    icon?: ReactNode;
    borderRadius?: string;
    children?: ReactNode;
  }

  export const Sidebar: ComponentType<SidebarProps>;
  export const Logo: ComponentType<LogoProps>;
  export const Menu: ComponentType<MenuProps>;
  export const MenuItem: ComponentType<MenuItemProps>;
  export const Submenu: ComponentType<SubmenuProps>;
}
