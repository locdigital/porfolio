"use client";
import React, { type RefObject } from "react";

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
  animationNum: _animationNum,
  timelineRef: _timelineRef,
  customVariants: _customVariants,
  ...props
}: TimelineContentProps<T>) {
  const Tag = (as ?? "div") as React.ElementType;

  return (
    <Tag className={className} {...(props as object)}>
      {children}
    </Tag>
  );
}
