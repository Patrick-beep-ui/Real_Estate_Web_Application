"use client";

import Image from "next/image";
import { usePageConfig } from "@/context/PageContext";
import tarekHeadshot from "@/assets/tarek-headshot.png";
import MediaLogos from "@/components/shared/MediaLogos";
import type { LandingContent } from "@/lib/landing/data";

const WhyTarek = ({ landingSource }: { landingSource?: LandingContent }) => {
  const { situation, market } = usePageConfig();
  const interpolate = (text: string) => text.replaceAll("{market}", market.name);

  const whyTarek = landingSource?.whyTarek;

  const copy = {
    body: (whyTarek?.bodyParagraphs ?? situation.whyTarekBody).map(interpolate),
    urgencyLine: whyTarek?.urgencyLine ?? situation.urgencyLine,
  };

  return (
    <section className="py-16 md:py-24 bg-[hsl(220,20%,10%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-[auto_1fr] gap-12 items-start max-w-5xl mx-auto">
          {/* Image */}
          <div className="flex justify-center">
            <Image
              src={tarekHeadshot}
              alt="Tarek El Moussa"
              width={512}
              height={512}
              className="w-48 h-auto md:w-56 rounded-2xl object-cover"
              priority={false}
            />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              Why Tarek?
            </h2>
            {copy.body.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                {p}
              </p>
            ))}

            {/* Media logos — HGTV, CNN, Forbes, etc. */}
            <MediaLogos />

            {/* Show cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Flip or Flop", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346150678/iJUbMFjECkePQSOT.webp" },
                { name: "Flipping 101", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346150678/vfJuBpKuiMKRTijy.webp" },
                { name: "The Flipping El Moussas", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346150678/RzUgqClKTNevQIYx.webp" },
                { name: "The Flip Off", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346150678/giHvhHsujRsoddUn.webp" },
              ].map((show) => (
                <div key={show.name} className="text-center">
                  <img
                    src={show.img}
                    alt={show.name}
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{show.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgency line */}
        {copy.urgencyLine && (
          <p className="text-center text-lg text-muted-foreground mt-16 max-w-3xl mx-auto italic">
            {copy.urgencyLine.replace("{market}", market.name)}
          </p>
        )}
      </div>
    </section>
  );
};

export default WhyTarek;