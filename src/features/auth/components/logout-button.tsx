import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="secondary" size="sm">
        Log out
      </Button>
    </form>
  );
}
