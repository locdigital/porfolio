"use client";

import React from "react";

type SnapshotValue = string | number;
type Snapshot = Record<string, SnapshotValue>;

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  as?: React.ElementType;
};

const BlurText = ({
  text = "",
  delay: _delay = 200,
  className = "",
  animateBy = "words",
  direction: _direction = "top",
  threshold: _threshold = 0.1,
  rootMargin: _rootMargin = "0px",
  animationFrom: _animationFrom,
  animationTo: _animationTo,
  easing: _easing = (t) => t,
  onAnimationComplete: _onAnimationComplete,
  stepDuration: _stepDuration = 0.35,
  as: Component = "p",
}: BlurTextProps) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <Component className={className} style={{ display: "flex", flexWrap: "wrap" }}>
      {elements.map((segment, index) => (
          <span
            className="inline-block"
            key={`${segment}-${index}`}
          >
            {segment === " " ? "\u00A0" : segment}
            {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
          </span>
      ))}
    </Component>
  );
};

export default BlurText;
