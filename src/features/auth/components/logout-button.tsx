import { Button } from "@/components/ui/button";
import { LogOutIcon } from "@/components/ui/icons";
import { logout } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" className="w-full justify-start gap-3 px-3">
        <LogOutIcon />
        Log out
      </Button>
    </form>
  );
}
