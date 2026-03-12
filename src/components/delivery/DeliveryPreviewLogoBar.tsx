import Image from "next/image";

export function DeliveryPreviewLogoBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-24 items-center justify-center border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="BrosStudio"
          width={180}
          height={46}
          className="h-12 w-auto object-contain sm:h-14"
          priority
        />
      </div>
    </header>
  );
}
