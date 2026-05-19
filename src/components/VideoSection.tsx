"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { MessageCircle, Phone, Volume2, VolumeX } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import tarekHeadshot from "@/assets/tarek-headshot.png";
import { VIDEOS } from "@/lib/data/videos";

const VIDEO_CDN_URL = "/tarek-intro.mp4";
const FALLBACK_VIDEO_ID = "Gj0TV2sMyVQ";

const VideoSection = () => {
  const { phone, smsLink, telLink, situation, market, text } = usePageConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoId = VIDEOS[situation.slug] || FALLBACK_VIDEO_ID;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % situation.videoCaptionLines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [situation.videoCaptionLines.length]);

  const handleVideoLoaded = useCallback(() => setVideoLoaded(true), []);

  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);

  const handleToggleMute = useCallback(() => {
    const iframe = youtubeIframeRef.current;
    if (!iframe) return;
    const method = isMuted ? "unMute" : "mute";
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: method, args: [] }),
      "*"
    );
    setIsMuted(!isMuted);
  }, [isMuted]);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Watch Before You Call — {market.name}
          </h2>
          <p className="text-muted-foreground text-lg">
            60 seconds. This is exactly how we help {market.name} homeowners.
          </p>
        </div>

        <div className="flex justify-center mb-10" ref={containerRef}>
          <div className="relative w-[280px] sm:w-[320px] rounded-[2.5rem] border-[6px] border-border bg-black overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-28 h-7 bg-black rounded-b-2xl" />
            <div className="relative" style={{ aspectRatio: "9/16" }}>
            {isVisible ? (
              videoId ? (
              <iframe
                ref={youtubeIframeRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                title="Video"
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  loop
                  preload="metadata"
                  poster={tarekHeadshot.src}
                  className="w-full h-full object-cover"
                  onCanPlay={handleVideoLoaded}
                >
                  <source src={VIDEO_CDN_URL} type="video/mp4" />
                </video>
              )
            ) : (
              <Image
                src={tarekHeadshot}
                alt="Tarek El Moussa"
                fill
                sizes="100vw"
                className="object-cover"
              />
            )}

              <div className="absolute bottom-12 left-0 right-0 z-20 px-4">
                <p className="text-white text-center text-sm font-semibold drop-shadow-lg transition-opacity duration-500">
                  {/*situation.videoCaptionLines[currentLine]*/}
                </p>
              </div>
              <button
                onClick={handleToggleMute}
                className="absolute bottom-14 right-4 z-30 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white cursor-pointer" /> : <Volume2 className="w-5 h-5 text-white cursor-pointer" />}
              </button>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent z-10" />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-500 rounded-full z-30" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <a
            href={smsLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-lg shadow-amber"
          >
            <MessageCircle className="w-5 h-5" />
            Text {text}
          </a>
          <a
            href={telLink}
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg"
          >
            <Phone className="w-5 h-5" />
            Call {phone}
          </a>
        </div>

        <div className="max-w-3xl mx-auto">
          {situation.whyTarekBody.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-6">
              {p.replaceAll("{market}", market.name)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;