import { Logo } from "@/components/layout/logo";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-center bg-surface px-4 py-12 outline-none">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm p-6 sm:p-8">{children}</Card>
    </main>
  );
}
