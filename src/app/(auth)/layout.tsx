import { Logo } from "@/components/layout/logo";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm p-6 sm:p-8">{children}</Card>
    </main>
  );
}
