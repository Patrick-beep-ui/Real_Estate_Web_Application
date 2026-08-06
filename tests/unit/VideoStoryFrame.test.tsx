/// <reference types="jest" />

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import VideoStoryFrame from "@/components/testimonials/VideoStoryFrame";
import type { VideoStory } from "@/types/testimonial";

function makeStory(overrides: Partial<VideoStory> = {}): VideoStory {
  return {
    id: "alice",
    kind: "video",
    name: "Alice Blackwelder",
    initial: "A",
    location: "Charlotte, NC",
    headline: "A quick and fair cash sale",
    body: "body",
    scenario: "Cash sale",
    src: "https://mcgzyxrozhogzmohyfos.supabase.co/storage/v1/object/public/testimonial-videos/missing.mp4",
    thumbnail: "https://mcgzyxrozhogzmohyfos.supabase.co/storage/v1/object/public/testimonial-thumbnails/missing.jpg",
    points: [],
    ...overrides,
  };
}

describe("VideoStoryFrame", () => {
  it("shows the initials placeholder when the thumbnail fails to load", () => {
    render(<VideoStoryFrame story={makeStory()} />);

    const img = screen.getByAltText("Alice Blackwelder video testimonial thumbnail");
    fireEvent.error(img);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByAltText("Alice Blackwelder video testimonial thumbnail")).not.toBeInTheDocument();
  });

  it("keeps the initial visible with a corner play button when the thumbnail fails", () => {
    render(<VideoStoryFrame story={makeStory()} />);

    const img = screen.getByAltText("Alice Blackwelder video testimonial thumbnail");
    fireEvent.error(img);

    expect(screen.getByText("A")).toBeInTheDocument();
    const play = screen.getByRole("button", { name: /play video testimonial/i });
    const circle = play.querySelector("span");
    expect(circle).not.toBeNull();
    expect(circle?.className).toMatch(/bottom-3/);
    expect(circle?.className).toMatch(/right-3/);
  });

  it("shows a 'Video unavailable' panel with a Retry button when the video fails to play", () => {
    const { container } = render(<VideoStoryFrame story={makeStory()} />);

    fireEvent.click(screen.getByRole("button", { name: /play video testimonial/i }));

    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.error(video as HTMLVideoElement);

    expect(screen.getByText("Video unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders the coming-soon state for a story with no media", () => {
    render(<VideoStoryFrame story={makeStory({ src: undefined, youtubeId: undefined, thumbnail: undefined })} />);

    expect(screen.getByText("Video coming soon")).toBeInTheDocument();
  });
});
