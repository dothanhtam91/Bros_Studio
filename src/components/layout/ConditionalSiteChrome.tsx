"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteAmbientMusic } from "@/components/layout/SiteAmbientMusic";

export function ConditionalSiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDeliveryPreview = pathname?.startsWith("/delivery-preview");
  const isDeliveryPage = pathname?.startsWith("/delivery/");
  const isAdmin = pathname?.startsWith("/admin");

  if (isDeliveryPreview || isDeliveryPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      {!isAdmin && <SiteAmbientMusic />}
    </>
  );
}
