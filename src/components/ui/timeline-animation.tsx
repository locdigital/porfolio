"use client";
import React from "react";

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
  const Tag = (as ?? "div") as string;

  return (
    <Tag
      className={className}
      {...(props as object)}
    >
      {children}
    </Tag>
  );
}

