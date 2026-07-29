"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { VideoStory } from "@/data/testimonials";

/**
 * Vertical (9:16) video testimonial with the site's facade pattern — the
 * iframe or <video> only mounts after a click, so landing pages stay fast.
 * Falls back to a labelled placeholder when the story has no media yet.
 */
export default function VideoStoryFrame({
  story,
  className = "",
}: {
  story: VideoStory;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const thumb =
    story.poster ??
    (story.youtubeId ? `https://i.ytimg.com/vi/${story.youtubeId}/hqdefault.jpg` : null);

  if (playing && story.youtubeId) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${story.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
          title={`${story.name} — Tarek Buys Houses`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (playing && story.src) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={story.src} poster={story.poster} controls autoPlay playsInline className="w-full h-full object-cover" />
      </div>
    );
  }

  const playable = Boolean(story.youtubeId || story.src);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
      {thumb ? (
        <img
          src={thumb}
          alt={`${story.name} video testimonial thumbnail`}
          loading="lazy"
          className="w-full h-full object-cover opacity-80"
        />
      ) : playable ? (
        <div className="absolute inset-0 bg-black" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-border bg-secondary px-4 text-center">
          <span className="text-xs text-muted-foreground">Video coming soon</span>
        </div>
      )}
      {playable ? (
        <button
          onClick={() => setPlaying(true)}
          aria-label={`Play video testimonial from ${story.name}`}
          className="group absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 pl-1 shadow-lg transition-transform group-hover:scale-110">
            <Play className="h-7 w-7 text-primary-foreground" />
          </span>
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/40 pl-1">
            <Play className="h-7 w-7 text-primary-foreground/70" />
          </span>
        </div>
      )}
    </div>
  );
}
