"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Volume2, VolumeX, RotateCcw } from "lucide-react";
import type { VideoStory } from "@/data/testimonials";

export default function VideoStoryFrame({
  story,
  className = "",
  autoPlay = false,
}: {
  story: VideoStory;
  className?: string;
  autoPlay?: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (autoPlay) setPlaying(true);
  }, [autoPlay]);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);
  const prevYoutubeState = useRef<number | null>(null);

  const thumb =
    story.poster ??
    (story.youtubeId ? `https://i.ytimg.com/vi/${story.youtubeId}/hqdefault.jpg` : null);

  // YouTube JS API: listen for state changes (playing / ended)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.origin === "string" && !e.origin.includes("youtube")) return;
      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== "object") return;
      if (data.event === "onStateChange") {
        const newState = data.info;
        prevYoutubeState.current = newState;
        if (newState === 1) {
          setHasEnded(false);
        } else if (newState === 0) {
          setHasEnded(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // YouTube: register event listeners on iframe load
  useEffect(() => {
    const iframe = youtubeIframeRef.current;
    if (!iframe) return;
    const handleLoad = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1 }), "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*"
      );
    };
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [playing]);

  const handleToggleMute = useCallback(() => {
    const nextIsMuted = !isMuted;
    const iframe = youtubeIframeRef.current;
    if (iframe) {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: nextIsMuted ? "mute" : "unMute", args: [] }), "*"
      );
    }
    setIsMuted(nextIsMuted);
  }, [isMuted]);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hasEnded) {
      video.currentTime = 0;
      video.play();
    } else if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, [hasEnded]);

  // ── YouTube playing state ──
  if (playing && story.youtubeId) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
        <iframe
          ref={youtubeIframeRef}
          src={`https://www.youtube-nocookie.com/embed/${story.youtubeId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1&controls=0`}
          title={`${story.name} — Tarek Buys Houses`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full"
        />
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleMute(); }}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>
    );
  }

  // ── Direct <video> playing state ──
  if (playing && story.src) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={story.src}
          poster={story.poster}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleVideoClick}
          onPlay={() => { setIsPlaying(true); setHasEnded(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); setHasEnded(true); }}
        />
        {(hasEnded || !isPlaying) && (
          <button
            onClick={(e) => { e.stopPropagation(); handleVideoClick(); }}
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
            aria-label={hasEnded ? "Replay" : "Play"}
          >
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
              {hasEnded ? (
                <RotateCcw className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" />
              )}
            </div>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleMute(); }}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>
    );
  }

  // ── Pre-play facade (thumbnail + play button) ──
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
