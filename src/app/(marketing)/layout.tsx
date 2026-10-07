import { SiteFooter } from "@/components/layout/site-footer";
import { Navbar } from "@/components/layout/navbar";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
