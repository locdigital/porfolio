"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

export type CursorAvatarDirection =
  | "center"
  | "left"
  | "right"
  | "up"
  | "down"
  | "upLeft"
  | "upRight"
  | "downLeft"
  | "downRight";

export type CursorAvatarVariant = "primary" | "secondary";

export interface CursorAvatarImageSet {
  center: string;
  left: string;
  right: string;
  up: string;
  down: string;
  upLeft: string;
  upRight: string;
  downLeft: string;
  downRight: string;
}

export interface CursorAvatarProps extends CursorAvatarImageSet {
  trackingRadius?: number;
  smoothness?: number;
  springStiffness?: number;
  springDamping?: number;
  returnSpeed?: number;
  trackingStrength?: number;
  directionThreshold?: number;
  hysteresis?: number;
  enablePageTracking?: boolean;
  enableHoverOnly?: boolean;
  subtleMotion?: boolean;

  secondary?: Partial<CursorAvatarImageSet>;
  secondaryImages?: Partial<CursorAvatarImageSet>;
  secondarySprite?: string | Partial<CursorAvatarImageSet>;

  activeVariant?: CursorAvatarVariant;
  defaultVariant?: CursorAvatarVariant;
  onVariantChange?: (variant: CursorAvatarVariant) => void;
  onPoseChange?: (pose: CursorAvatarDirection) => void;

  className?: string;
  style?: CSSProperties;
  alt?: string;
  ariaLabel?: string;
  onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}

const POSES: CursorAvatarDirection[] = [
  "center",
  "left",
  "right",
  "up",
  "down",
  "upLeft",
  "upRight",
  "downLeft",
  "downRight",
];

const DIRECTIONAL_POSES = POSES.filter(
  (pose) => pose !== "center",
) as Exclude<CursorAvatarDirection, "center">[];

const DIAGONAL = Math.SQRT1_2;

const VECTORS: Record<Exclude<CursorAvatarDirection, "center">, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  upLeft: { x: -DIAGONAL, y: -DIAGONAL },
  upRight: { x: DIAGONAL, y: -DIAGONAL },
  downLeft: { x: -DIAGONAL, y: DIAGONAL },
  downRight: { x: DIAGONAL, y: DIAGONAL },
};

const MOTION_OFFSET: Record<CursorAvatarDirection, number> = {
  center: 0,
  left: 0.37,
  right: 0.74,
  up: 1.11,
  down: 1.48,
  upLeft: 1.85,
  upRight: 2.22,
  downLeft: 2.59,
  downRight: 2.96,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampUnit(value: number) {
  return clamp(value, -1, 1);
}

function getClosestDirectionalPose(x: number, y: number) {
  const magnitude = Math.hypot(x, y);

  if (magnitude === 0) return "center";

  const nx = x / magnitude;
  const ny = y / magnitude;
  let bestPose: Exclude<CursorAvatarDirection, "center"> = "right";
  let bestScore = -Infinity;

  for (const pose of DIRECTIONAL_POSES) {
    const vector = VECTORS[pose];
    const score = nx * vector.x + ny * vector.y;

    if (score > bestScore) {
      bestScore = score;
      bestPose = pose;
    }
  }

  return bestPose;
}

function resolvePose(
  x: number,
  y: number,
  currentPose: CursorAvatarDirection,
  directionThreshold: number,
  hysteresis: number,
): CursorAvatarDirection {
  const magnitude = Math.hypot(x, y);
  const threshold = clamp(directionThreshold, 0, 1);
  const hysteresisAmount = clamp(hysteresis, 0, 0.45);
  const exitThreshold = Math.max(0, threshold - hysteresisAmount);

  if (currentPose === "center" && magnitude < threshold) {
    return "center";
  }

  if (currentPose !== "center") {
    if (magnitude < exitThreshold) return "center";
    if (magnitude < threshold) return currentPose;
  }

  const candidate = getClosestDirectionalPose(x, y);

  if (candidate === "center" || candidate === currentPose || currentPose === "center") {
    return candidate;
  }

  const currentVector = VECTORS[currentPose as Exclude<CursorAvatarDirection, "center">];
  const candidateVector = VECTORS[candidate];

  if (!currentVector) return candidate;

  const nx = x / magnitude;
  const ny = y / magnitude;
  const currentScore = nx * currentVector.x + ny * currentVector.y;
  const candidateScore = nx * candidateVector.x + ny * candidateVector.y;

  return candidateScore > currentScore + hysteresisAmount ? candidate : currentPose;
}

function setMotionVars(root: HTMLElement | null, x: number, y: number, reduced: boolean) {
  if (!root) return;

  const motionX = reduced ? 0 : x;
  const motionY = reduced ? 0 : y;
  const distance = clamp(Math.hypot(motionX, motionY), 0, 1);

  root.style.setProperty("--cursor-avatar-translate-x", `${(motionX * 10).toFixed(3)}px`);
  root.style.setProperty("--cursor-avatar-translate-y", `${(motionY * 10).toFixed(3)}px`);
  root.style.setProperty("--cursor-avatar-rotate-x", `${(-motionY * 7).toFixed(3)}deg`);
  root.style.setProperty("--cursor-avatar-rotate-y", `${(motionX * 8).toFixed(3)}deg`);
  root.style.setProperty("--cursor-avatar-scale", (1 + distance * 0.018).toFixed(4));
  root.style.setProperty("--cursor-avatar-spot-x", `${(50 + motionX * 26).toFixed(2)}%`);
  root.style.setProperty("--cursor-avatar-spot-y", `${(50 + motionY * 26).toFixed(2)}%`);
  root.style.setProperty("--cursor-avatar-energy", distance.toFixed(4));
}

export function CursorAvatar({
  center,
  left,
  right,
  up,
  down,
  upLeft,
  upRight,
  downLeft,
  downRight,

  trackingRadius = 280,
  smoothness = 0.72,
  springStiffness = 120,
  springDamping = 18,
  returnSpeed = 8,
  trackingStrength = 1,
  directionThreshold = 0.22,
  hysteresis = 0.08,
  enablePageTracking = true,
  enableHoverOnly = false,
  subtleMotion = true,

  secondary,
  secondaryImages,
  secondarySprite,

  activeVariant,
  defaultVariant = "primary",
  onVariantChange,
  onPoseChange,

  className,
  style,
  alt = "Cursor avatar",
  ariaLabel,
  onClick,
}: CursorAvatarProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const hoverRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const poseRef = useRef<CursorAvatarDirection>("center");
  const onPoseChangeRef = useRef(onPoseChange);

  const springRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
  });

  const [pose, setPose] = useState<CursorAvatarDirection>("center");
  const [internalVariant, setInternalVariant] = useState<CursorAvatarVariant>(defaultVariant);

  onPoseChangeRef.current = onPoseChange;

  const primaryImages = useMemo<CursorAvatarImageSet>(
    () => ({
      center,
      left,
      right,
      up,
      down,
      upLeft,
      upRight,
      downLeft,
      downRight,
    }),
    [center, left, right, up, down, upLeft, upRight, downLeft, downRight],
  );

  const secondarySet = useMemo<CursorAvatarImageSet | null>(() => {
    const source = secondaryImages ?? secondary ?? secondarySprite;

    if (!source) return null;

    if (typeof source === "string") {
      return POSES.reduce((set, direction) => {
        set[direction] = source;
        return set;
      }, {} as CursorAvatarImageSet);
    }

    return {
      ...primaryImages,
      ...source,
    };
  }, [primaryImages, secondary, secondaryImages, secondarySprite]);

  const preloadUrls = useMemo(() => {
    const urls = new Set<string>();

    for (const poseName of POSES) {
      urls.add(primaryImages[poseName]);
      if (secondarySet) urls.add(secondarySet[poseName]);
    }

    return Array.from(urls).filter(Boolean);
  }, [primaryImages, secondarySet]);

  const currentVariant = activeVariant ?? internalVariant;
  const hasSecondary = Boolean(secondarySet);
  const visibleVariant: CursorAvatarVariant =
    currentVariant === "secondary" && secondarySet ? "secondary" : "primary";

  const activeImages = visibleVariant === "secondary" && secondarySet ? secondarySet : primaryImages;
  const activeSrc = activeImages[pose];
  const isInteractive = Boolean(onClick || hasSecondary);

  const configRef = useRef({
    trackingRadius,
    smoothness,
    springStiffness,
    springDamping,
    returnSpeed,
    trackingStrength,
    directionThreshold,
    hysteresis,
    enableHoverOnly,
    subtleMotion,
  });

  configRef.current = {
    trackingRadius,
    smoothness,
    springStiffness,
    springDamping,
    returnSpeed,
    trackingStrength,
    directionThreshold,
    hysteresis,
    enableHoverOnly,
    subtleMotion,
  };

  const rootStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-block",
      width: 240,
      height: 240,
      overflow: "hidden",
      touchAction: "manipulation",
      ...style,
      position: "relative",
      cursor: isInteractive ? "pointer" : style?.cursor,
    }),
    [isInteractive, style],
  );

  useEffect(() => {
    const images = preloadUrls.map((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });

    return () => {
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [preloadUrls]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      reducedMotionRef.current = media.matches;
    };

    sync();
    media.addEventListener?.("change", sync);

    return () => {
      media.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updatePointer = (event: PointerEvent) => {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      pointerRef.current.active = true;
    };

    const handleEnter = (event: PointerEvent) => {
      hoverRef.current = true;
      updatePointer(event);
    };

    const handleLeave = () => {
      hoverRef.current = false;
      pointerRef.current.active = false;
    };

    const handleWindowExit = () => {
      hoverRef.current = false;
      pointerRef.current.active = false;
    };

    if (enablePageTracking && !enableHoverOnly) {
      window.addEventListener("pointermove", updatePointer, { passive: true });
      window.addEventListener("blur", handleWindowExit);

      return () => {
        window.removeEventListener("pointermove", updatePointer);
        window.removeEventListener("blur", handleWindowExit);
      };
    }

    root.addEventListener("pointerenter", handleEnter, { passive: true });
    root.addEventListener("pointermove", updatePointer, { passive: true });
    root.addEventListener("pointerleave", handleLeave, { passive: true });

    return () => {
      root.removeEventListener("pointerenter", handleEnter);
      root.removeEventListener("pointermove", updatePointer);
      root.removeEventListener("pointerleave", handleLeave);
    };
  }, [enablePageTracking, enableHoverOnly]);

  useEffect(() => {
    let frame = 0;
    let previousTime = performance.now();

    const getDesiredTarget = () => {
      const root = rootRef.current;
      const pointer = pointerRef.current;
      const config = configRef.current;

      if (!root || !pointer.active) return { x: 0, y: 0, active: false };
      if (config.enableHoverOnly && !hoverRef.current) return { x: 0, y: 0, active: false };

      const rect = root.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        return { x: 0, y: 0, active: false };
      }

      const radius = Math.max(1, config.trackingRadius);
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);

      if (distance > radius) return { x: 0, y: 0, active: false };

      const strength = Math.max(0, config.trackingStrength);

      return {
        x: clampUnit((dx / radius) * strength),
        y: clampUnit((dy / radius) * strength),
        active: true,
      };
    };

    const applySubtleMotion = (time: number, currentPose: CursorAvatarDirection) => {
      const image = imageRef.current;
      const config = configRef.current;

      if (!image) return;

      if (!config.subtleMotion || reducedMotionRef.current) {
        image.style.transform = "translate3d(0, 0, 0) rotate(0deg) scale(1)";
        return;
      }

      const seconds = time / 1000;
      const phase = seconds + MOTION_OFFSET[currentPose];

      const tx = Math.sin(phase * 1.35) * 2;
      const ty = Math.cos(phase * 1.1) * 2;
      const rotate = Math.sin(phase * 0.9) * 1;
      const scale = 1 + ((Math.sin(phase * 1.2) + 1) / 2) * 0.01;

      image.style.transform = `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(
        3,
      )}px, 0) rotate(${rotate.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    };

    const tick = (time: number) => {
      const dt = clamp((time - previousTime) / 1000, 0.001, 0.04);
      previousTime = time;

      const config = configRef.current;
      const spring = springRef.current;
      const desired = getDesiredTarget();

      const smooth = clamp(config.smoothness, 0, 0.98);
      const targetEase = desired.active
        ? 1 - Math.pow(smooth, dt * 60)
        : 1 - Math.exp(-Math.max(0.01, config.returnSpeed) * dt);

      spring.targetX += (desired.x - spring.targetX) * targetEase;
      spring.targetY += (desired.y - spring.targetY) * targetEase;

      const stiffness = Math.max(0, config.springStiffness);
      const damping = Math.max(0, config.springDamping);
      const dampingFactor = Math.exp(-damping * dt);

      spring.vx += (spring.targetX - spring.x) * stiffness * dt;
      spring.vy += (spring.targetY - spring.y) * stiffness * dt;
      spring.vx *= dampingFactor;
      spring.vy *= dampingFactor;

      spring.x = clampUnit(spring.x + spring.vx * dt);
      spring.y = clampUnit(spring.y + spring.vy * dt);

      const nextPose = resolvePose(
        spring.x,
        spring.y,
        poseRef.current,
        config.directionThreshold,
        config.hysteresis,
      );

      if (nextPose !== poseRef.current) {
        poseRef.current = nextPose;
        setPose(nextPose);
        onPoseChangeRef.current?.(nextPose);
      }

      setMotionVars(rootRef.current, spring.x, spring.y, reducedMotionRef.current);
      applySubtleMotion(time, nextPose);
      frame = requestAnimationFrame(tick);
    };

    setMotionVars(rootRef.current, 0, 0, reducedMotionRef.current);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  const toggleVariant = () => {
    if (!secondarySet) return;

    const nextVariant: CursorAvatarVariant =
      visibleVariant === "primary" ? "secondary" : "primary";

    if (activeVariant === undefined) {
      setInternalVariant(nextVariant);
    }

    onVariantChange?.(nextVariant);
  };

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      toggleVariant();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <div
      ref={rootRef}
      className={className}
      style={rootStyle}
      data-pose={pose}
      data-variant={visibleVariant}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? ariaLabel ?? alt : undefined}
      aria-pressed={hasSecondary ? visibleVariant === "secondary" : undefined}
    >
      <img
        ref={imageRef}
        className="cursor-avatar-image"
        src={activeSrc}
        alt={isInteractive ? "" : alt}
        draggable={false}
        decoding="async"
        loading="eager"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default CursorAvatar;
