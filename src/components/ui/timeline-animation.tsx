"use client";
import { motion, useInView } from "framer-motion";
import React, { useRef, type RefObject } from "react";

type ValidTag = keyof JSX.IntrinsicElements;

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
  const localRef = useRef<HTMLElement>(null);
  const ref = timelineRef ?? localRef;
  const isInView = useInView(ref as RefObject<Element>, {
    once: true,
    margin: "0px 0px -60px 0px",
  });

  const defaultVariants = {
    hidden: { opacity: 0, filter: "blur(8px)", y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const variants = customVariants ?? defaultVariants;
  const Tag = (as ?? "div") as string;
  const MotionTag = (motion as any)[Tag] || motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={variants as never}
      {...(props as object)}
    >
      {children}
    </MotionTag>
  );
}

