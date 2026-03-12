"use client";

type Props = {
  videoUrl: string;
};

export function WalkthroughVideo({ videoUrl }: Props) {
  const isYouTube = /youtube\.com|youtu\.be/i.test(videoUrl);
  const isVimeo = /vimeo\.com/i.test(videoUrl);

  const containerClass = "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8";
  const videoWrapClass = "aspect-video w-full overflow-hidden rounded-2xl bg-stone-900 shadow-lg ring-1 ring-stone-200/50";

  if (isYouTube) {
    const id = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1];
    if (!id) return null;
    return (
      <section className={containerClass} aria-label="Walkthrough video">
        <div className={videoWrapClass}>
          <iframe
            src={`https://www.youtube.com/embed/${id}?rel=0`}
            title="Property walkthrough"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </section>
    );
  }

  if (isVimeo) {
    const id = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    if (!id) return null;
    return (
      <section className={containerClass} aria-label="Walkthrough video">
        <div className={videoWrapClass}>
          <iframe
            src={`https://player.vimeo.com/video/${id}`}
            title="Property walkthrough"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </section>
    );
  }

  return (
    <section className={containerClass} aria-label="Walkthrough video">
      <div className={videoWrapClass}>
        <video
          src={videoUrl}
          controls
          playsInline
          className="h-full w-full object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
