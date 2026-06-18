"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface BlogTableOfContentsProps {
  content: string;
}

export function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const extracted: Heading[] = [];

    for (const line of content.split("\n")) {
      const h2Match = line.match(/^## (.+?)$/);
      const h3Match = line.match(/^### (.+?)$/);

      if (h2Match) {
        const text = h2Match[1].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        extracted.push({ id, text, level: 2 });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        extracted.push({ id, text, level: 3 });
      }
    }

    setHeadings(extracted.slice(0, 12));
  }, [content]);

  if (headings.length < 2) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <aside className="bg-muted/50 border border-border rounded-lg p-6 mb-8 animate-fade-in-up">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded font-mono">
          Contents
        </span>
        In This Article
      </h2>
      <nav aria-label="Table of contents">
        <ul className="space-y-2 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 2) * 1.25}rem` }}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className="text-accent hover:text-accent/80 hover:underline transition-colors text-left"
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
