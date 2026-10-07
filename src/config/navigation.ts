import type { ComponentType } from "react";
import { DashboardIcon, type IconProps } from "@/components/ui/icons";
import type { NavItem } from "@/types";

/** Public site navigation (Navbar). */
export const marketingNav: readonly NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export type AppNavItem = NavItem & { icon: ComponentType<IconProps> };

/**
 * Authenticated app navigation (Sidebar). Add an entry here when a new
 * section ships; only list routes that exist.
 */
export const appNav: readonly AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
];
