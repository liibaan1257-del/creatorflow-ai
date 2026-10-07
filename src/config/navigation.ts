import type { ComponentType } from "react";
import {
  DashboardIcon,
  FolderIcon,
  ImageIcon,
  PenIcon,
  SettingsIcon,
  TemplateIcon,
  type IconProps,
} from "@/components/ui/icons";
import type { NavItem } from "@/types";

/** Public site navigation (Navbar). */
export const marketingNav: readonly NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export type AppNavItem = NavItem & {
  icon: ComponentType<IconProps>;
  /** Shows a "Soon" badge while the section is still in development. */
  comingSoon?: boolean;
};

/**
 * Authenticated app navigation (sidebar). Every route here is protected by
 * the proxy (see APP_ROUTES in src/lib/auth/redirect.ts).
 */
export const appNav: readonly AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "AI Writer", href: "/writer", icon: PenIcon, comingSoon: true },
  { label: "AI Images", href: "/images", icon: ImageIcon, comingSoon: true },
  { label: "My Projects", href: "/projects", icon: FolderIcon },
  { label: "Templates", href: "/templates", icon: TemplateIcon, comingSoon: true },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];
