export default function RealtorDeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-100">
      {children}
    </div>
  );
}
