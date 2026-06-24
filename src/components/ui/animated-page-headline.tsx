"use client";

import { useMemo, useRef } from "react";
import BlurFade from "./blur-fade";
import { TimelineContent } from "./timeline-animation";

type HeadlinePart = {
  text: string;
  emphasized: boolean;
};

interface AnimatedPageHeadlineProps {
  headline: string;
  className?: string;
}

interface AnimatedPageDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const textVariants = {
  visible: (i: number) => ({
    filter: "blur(0px)",
    opacity: 1,
    transition: {
      delay: i * 0.14,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  hidden: {
    filter: "blur(8px)",
    opacity: 0,
  },
};

function parseHeadline(headline: string): HeadlinePart[] {
  const parts: HeadlinePart[] = [];
  const emphasisPattern = /<em>(.*?)<\/em>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emphasisPattern.exec(headline))) {
    if (match.index > lastIndex) {
      parts.push({
        text: headline.slice(lastIndex, match.index),
        emphasized: false,
      });
    }

    parts.push({
      text: match[1],
      emphasized: true,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < headline.length) {
    parts.push({
      text: headline.slice(lastIndex),
      emphasized: false,
    });
  }

  return parts;
}

export default function AnimatedPageHeadline({ headline, className }: AnimatedPageHeadlineProps) {
  const heroRef = useRef<HTMLHeadingElement>(null);
  const parts = useMemo(() => parseHeadline(headline), [headline]);

  let highlightIndex = 0;

  return (
    <BlurFade delay={0.15}>
      <h1 ref={heroRef} className={className}>
        {parts.map((part, index) => {
          if (!part.emphasized) {
            return part.text;
          }

          const currentHighlightIndex = highlightIndex++;
          return (
            <TimelineContent
              as="em"
              key={`${part.text}-${index}`}
              animationNum={currentHighlightIndex + 2}
              timelineRef={heroRef}
              customVariants={textVariants}
              style={{
                fontStyle: "italic",
                color: "var(--accent)",
                border: "1.5px dashed rgba(0,117,222,0.38)",
                borderRadius: "6px",
                padding: "0 6px",
                display: "inline-block",
                whiteSpace: "nowrap",
              }}
            >
              {part.text}
            </TimelineContent>
          );
        })}
      </h1>
    </BlurFade>
  );
}

export function AnimatedPageDescription({
  children,
  className,
}: AnimatedPageDescriptionProps) {
  return (
    <TimelineContent
      as="p"
      animationNum={4}
      customVariants={textVariants}
      className={className}
    >
      {children}
    </TimelineContent>
  );
}
