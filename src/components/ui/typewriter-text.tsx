"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";

export interface TypingAnimationProps {
  children?: string;
  text?: string | string[];
  duration?: number;
  deleteDuration?: number;
  delay?: number;
  loop?: boolean;
  className?: string;
}

export function TypingAnimation({
  children,
  text,
  duration = 92,
  deleteDuration = 58,
  delay = 1650,
  loop = true,
  className,
}: TypingAnimationProps) {
  const textArray = useMemo(() => {
    if (Array.isArray(text)) return text;
    if (typeof text === "string") return [text];
    return children ? [children] : [""];
  }, [children, text]);
  const [displayText, setDisplayText] = useState(textArray[0] ?? "");
  const [currentIndex, setCurrentIndex] = useState(textArray[0]?.length ?? 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const currentText = textArray[textArrayIndex] ?? "";

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayText(currentText);
      return;
    }

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText(currentText.slice(0, currentIndex + 1));
            setCurrentIndex((prev) => prev + 1);
            return;
          }

          if (loop && textArray.length > 1) {
            setIsDeleting(true);
          }

          return;
        }

        if (currentIndex > 0) {
          const nextIndex = currentIndex - 1;
          setDisplayText(currentText.slice(0, nextIndex));
          setCurrentIndex(nextIndex);
          return;
        }

        const nextTextArrayIndex = (textArrayIndex + 1) % textArray.length;
        setIsDeleting(false);
        setTextArrayIndex(nextTextArrayIndex);
        setCurrentIndex(0);
      },
      isDeleting ? deleteDuration : currentIndex === currentText.length ? delay : duration,
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    currentIndex,
    currentText,
    delay,
    deleteDuration,
    duration,
    isDeleting,
    loop,
    textArray,
    textArrayIndex,
  ]);

  return (
    <span className={className} aria-live="polite">
      <span>{displayText}</span>
    </span>
  );
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
  cursorClassName = "typewriter-cursor",
}: TypewriterProps) {
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            window.setTimeout(() => setIsDeleting(true), delay);
          }
          return;
        }

        if (displayText.length > 0) {
          setDisplayText((prev) => prev.slice(0, -1));
          return;
        }

        setIsDeleting(false);
        setCurrentIndex(0);
        setTextArrayIndex((prev) => (prev + 1) % textArray.length);
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => window.clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    textArray,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className={cursorClassName} aria-hidden="true">
        {cursor}
      </span>
    </span>
  );
}
