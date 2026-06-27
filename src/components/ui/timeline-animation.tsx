"use client";
import React, { useRef, type RefObject } from "react";
import { motion, useInView } from "framer-motion";

type ValidTag = keyof React.JSX.IntrinsicElements;

interface TimelineContentProps<T extends ValidTag = "div"> {
  as?: T;
  children?: React.ReactNode;
  className?: string;
  animationNum: number;
  timelineRef?: RefObject<HTMLElement | null>;
  customVariants?: {
    visible: (i: number) => object;
    hidden: object;
  };
  [key: string]: unknown;
}

export function TimelineContent<T extends ValidTag = "div">({
  as,
  children,
  className,
  animationNum,
  timelineRef,
  customVariants,
  ...props
}: TimelineContentProps<T>) {
  const Tag = (as ?? "div") as string;
  const elementRef = useRef<HTMLElement>(null);
  
  // Use timelineRef if provided, otherwise monitor this element directly
  const refToObserve = (timelineRef || elementRef) as RefObject<HTMLElement | null>;
  const isInView = useInView(refToObserve, { once: true, margin: "-50px" });

  const defaultVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.14,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hidden: {
      y: 36,
      opacity: 0,
      filter: "blur(8px)",
    },
  };

  const activeVariants = customVariants || defaultVariants;

  // Dynamically wrap the tag with motion
  const MotionTag = motion(Tag as any);

  return (
    <MotionTag
      ref={elementRef}
      className={className}
      custom={animationNum}
      variants={activeVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      {...(props as object)}
    >
      {children}
    </MotionTag>
  );
}

