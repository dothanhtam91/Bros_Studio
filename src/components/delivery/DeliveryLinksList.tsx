"use client";

type RealtorWithAlbums = {
  id: string;
  slug: string;
  name: string;
  brokerage: string | null;
  albums: { id: string; slug: string; address: string | null }[];
};

export function DeliveryLinksList({
  baseUrl,
  realtors,
}: {
  baseUrl: string;
  realtors: RealtorWithAlbums[];
}) {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ul className="mt-8 space-y-8">
      {realtors.map((r) => {
        const portfolioUrl = `${baseUrl}/delivery-preview/${r.slug}`;
        return (
          <li key={r.id} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <p className="font-medium text-stone-900">{r.name}</p>
            {r.brokerage && <p className="text-sm text-stone-500">{r.brokerage}</p>}
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Portfolio (all albums)</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-800">
                  {portfolioUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copy(portfolioUrl)}
                  className="shrink-0 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/80"
                >
                  Copy
                </button>
              </div>
            </div>
            {r.albums.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Album links</p>
                <ul className="mt-2 space-y-2">
                  {r.albums.map((a) => {
                    const albumUrl = `${baseUrl}/delivery-preview/${r.slug}/${a.slug}`;
                    return (
                      <li key={a.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-xs text-stone-500 sm:w-32 sm:shrink-0">{a.address ?? a.slug}</span>
                        <code className="min-w-0 flex-1 truncate rounded bg-stone-50 px-2 py-1.5 text-xs text-stone-700">
                          {albumUrl}
                        </code>
                        <button
                          type="button"
                          onClick={() => copy(albumUrl)}
                          className="shrink-0 rounded border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                        >
                          Copy
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
