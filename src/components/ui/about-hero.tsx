"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { useRef } from "react";
import BlurFade from "./blur-fade";

export default function AboutHero() {
  const heroRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.18,
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 36,
      opacity: 0,
    },
  };

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

  return (
    <div ref={heroRef} className="w-full">
      {/* Kicker */}
      <TimelineContent
        as="div"
        animationNum={0}
        timelineRef={heroRef}
        customVariants={textVariants}
        className="flex items-center gap-3 mb-6"
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--accent)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Introduction
        </span>
      </TimelineContent>

      {/* Main headline with BlurFade */}
      <BlurFade delay={0.15}>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(38px, 5vw, 52px)",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            marginBottom: "24px",
          }}
        >
          Performance marketer who{" "}
          <TimelineContent
            as="span"
            animationNum={2}
            timelineRef={heroRef}
            customVariants={textVariants}
            style={{
              fontStyle: "italic",
              color: "var(--accent)",
              border: "1.5px dashed rgba(0,117,222,0.4)",
              borderRadius: "6px",
              padding: "0 6px",
              display: "inline",
            }}
          >
            scales revenue
          </TimelineContent>{" "}
          with media &{" "}
          <TimelineContent
            as="span"
            animationNum={3}
            timelineRef={heroRef}
            customVariants={textVariants}
            style={{
              fontStyle: "italic",
              color: "#e07b39",
              border: "1.5px dashed rgba(224,123,57,0.4)",
              borderRadius: "6px",
              padding: "0 6px",
              display: "inline",
            }}
          >
            automation.
          </TimelineContent>
        </h1>
      </BlurFade>

      {/* Bio */}
      <TimelineContent
        as="div"
        animationNum={4}
        timelineRef={heroRef}
        customVariants={textVariants}
        style={{ marginBottom: "32px" }}
      >
        <p
          style={{
            fontSize: "14.5px",
            lineHeight: 1.75,
            color: "var(--muted)",
            maxWidth: "620px",
          }}
        >
          Hi, I'm Loc, a Senior Performance Marketing Executive based in Ho
          Chi Minh City, Vietnam. I scale multi-channel paid media across Meta,
          Google, and TikTok, connect creative to conversion, and build
          AI-powered systems that turn marketing spend into measurable growth.
        </p>
      </TimelineContent>

      {/* Bottom row: tagline + CTA */}
      <TimelineContent
        as="div"
        animationNum={5}
        timelineRef={heroRef}
        customVariants={textVariants}
        className="flex items-center justify-between gap-6 flex-wrap"
      >
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--muted)",
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
          >
            Based in Ho Chi Minh City
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Performance Senior Executive
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <a
            href="mailto:hi@loc.digital"
            style={{
              fontSize: "13.5px",
              fontWeight: 500,
              color: "var(--text)",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              textDecorationColor: "var(--divider)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--accent)";
              (e.currentTarget as HTMLAnchorElement).style.textDecorationColor =
                "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text)";
              (e.currentTarget as HTMLAnchorElement).style.textDecorationColor =
                "var(--divider)";
            }}
          >
            Email me
          </a>
          <a
            href="https://www.linkedin.com/in/phucloc"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13.5px",
              fontWeight: 500,
              color: "var(--text)",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              textDecorationColor: "var(--divider)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--accent)";
              (e.currentTarget as HTMLAnchorElement).style.textDecorationColor =
                "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text)";
              (e.currentTarget as HTMLAnchorElement).style.textDecorationColor =
                "var(--divider)";
            }}
          >
            LinkedIn
          </a>
        </div>
      </TimelineContent>
    </div>
  );
}
