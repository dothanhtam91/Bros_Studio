import { DeliveryPreviewLogoBar } from "@/components/delivery/DeliveryPreviewLogoBar";

export default function DeliveryPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-100">
      <DeliveryPreviewLogoBar />
      <div className="pt-24">{children}</div>
    </div>
  );
}
