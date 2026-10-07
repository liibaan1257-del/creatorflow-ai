"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownSeparator, dropdownItemClasses } from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from "@/components/ui/icons";
import { logout } from "@/features/auth/actions";

export type ProfileMenuUser = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
};

export function ProfileMenu({ user }: { user: ProfileMenuUser }) {
  const displayName = user.name ?? user.email ?? "Account";
  return (
    <DropdownMenu
      label="Account menu"
      trigger={
        <>
          <Avatar fallback={user.initials} src={user.avatarUrl} size="sm" />
          <span className="hidden max-w-40 truncate text-sm font-medium md:block">{displayName}</span>
          <ChevronDownIcon className="mr-1 hidden size-4 text-muted-foreground md:block" />
        </>
      }
    >
      <div className="flex items-center gap-3 px-2.5 py-2">
        <Avatar fallback={user.initials} src={user.avatarUrl} />
        <div className="min-w-0">
          {user.name ? <p className="truncate text-sm font-medium">{user.name}</p> : null}
          {user.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
        </div>
      </div>
      <DropdownSeparator />
      <Link href="/settings" className={dropdownItemClasses}>
        <SettingsIcon />
        Settings
      </Link>
      <form action={logout}>
        <button type="submit" className={dropdownItemClasses}>
          <LogOutIcon />
          Log out
        </button>
      </form>
    </DropdownMenu>
  );
}
