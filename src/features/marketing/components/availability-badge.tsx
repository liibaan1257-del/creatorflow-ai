import { Badge } from "@/components/ui/badge";
import type { Availability } from "@/features/marketing/content";

export function AvailabilityBadge({ status }: { status: Availability }) {
  return status === "available" ? (
    <Badge variant="success">Available now</Badge>
  ) : (
    <Badge>Coming soon</Badge>
  );
}
