import Image from "next/image";
import Link from "next/link";

export type AlbumCardData = {
  slug: string;
  address: string;
  shoot_date: string | null;
  cover_image_url: string | null;
  realtor_slug: string;
};

type AlbumCardProps = {
  album: AlbumCardData;
  basePath?: string;
};

export function AlbumCard({ album, basePath = "/r" }: AlbumCardProps) {
  const href = `${basePath}/${album.realtor_slug}/${album.slug}`;
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-md ring-1 ring-stone-200/50 transition hover:border-amber-300 hover:shadow-lg hover:ring-amber-200/50"
    >
      <div className="aspect-[4/3] overflow-hidden bg-stone-200">
        {album.cover_image_url ? (
          <Image
            src={album.cover_image_url}
            alt={album.address}
            width={400}
            height={300}
            className="h-full w-full object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            No cover
          </div>
        )}
      </div>
      <div className="border-t border-amber-100/80 p-4">
        <p className="font-medium text-stone-900">{album.address}</p>
        {album.shoot_date && (
          <p className="mt-1 text-sm text-amber-800/80">
            {new Date(album.shoot_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </Link>
  );
}
