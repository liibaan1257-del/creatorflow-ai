import type { ComponentType } from "react";
import { DashboardIcon, type IconProps } from "@/components/ui/icons";
import type { NavItem } from "@/types";

/** Public site navigation (Navbar). */
export const marketingNav: readonly NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "Who it's for", href: "/#audience" },
];

export type AppNavItem = NavItem & { icon: ComponentType<IconProps> };

/**
 * Authenticated app navigation (Sidebar). Add an entry here when a new
 * section ships; only list routes that exist.
 */
export const appNav: readonly AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
];
