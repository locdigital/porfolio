import React, { useState, useRef, useEffect } from 'react';
import { 
  motion, 
  useMotionValue, 
  useMotionTemplate, 
  useAnimationFrame 
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import { MousePointerClick, Info, Sun, Moon, Settings2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard Shadcn utility for merging Tailwind classes safely.
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper component for the SVG grid pattern.
 */
const GridPattern = ({ offsetX, offsetY, size }: { offsetX: MotionValue<number>; offsetY: MotionValue<number>; size: number }) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id="grid-pattern"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground" 
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};

/**
 * The Infinite Grid Component
 * Displays a scrolling background grid that reveals an active layer on mouse hover.
 */
export const InfiniteGrid = ({ bgOnly = false, globalMouse = false }: { bgOnly?: boolean; globalMouse?: boolean }) => {
  const [count, setCount] = useState(0);
  const [gridSize, setGridSize] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position with Motion Values for performance (avoids React re-renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Global mouse tracking when globalMouse is enabled
  useEffect(() => {
    if (!globalMouse) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [globalMouse, mouseX, mouseY]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (globalMouse) return;
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Grid offsets for infinite scroll animation
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0; 
  const speedY = 0;

  // Animation loop disabled to make background grid static
  /*
  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    // Reset offset at pattern width to simulate infinity
    gridOffsetX.set((currentX + speedX) % gridSize);
    gridOffsetY.set((currentY + speedY) % gridSize);
  });
  */

  // Create a dynamic radial mask for the "flashlight" effect
  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        bgOnly 
          ? "fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-[-1] bg-transparent" 
          : "relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-background"
      )}
    >
      {/* Layer 1: Subtle background grid (always visible) */}
      <div className={cn("absolute inset-0 z-0", bgOnly ? "opacity-[0.02]" : "opacity-[0.05]")}>
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
      </div>

      {/* Layer 2: Highlighted grid (revealed by mouse mask) */}
      <motion.div 
        className={cn("absolute inset-0 z-0", bgOnly ? "opacity-[0.15]" : "opacity-40")}
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
      </motion.div>

      {/* Decorative Blur Spheres */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/12 dark:bg-orange-600/5 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/12 dark:bg-blue-600/5 blur-[120px]" />
      </div>

      {/* Grid Density Control Panel & content hidden if configured as bgOnly */}
      {!bgOnly && (
        <>
          {/* Grid Density Control Panel */}
          <div className="absolute bottom-10 right-10 z-30 pointer-events-auto">
            <div className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl space-y-3 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Settings2 className="w-4 h-4" />
                Grid Density
              </div>
              <input 
                type="range" 
                min="20" 
                max="100" 
                value={gridSize} 
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                <span>Dense</span>
                <span>Sparse ({gridSize}px)</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto space-y-6 pointer-events-none">
             <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground drop-shadow-sm">
                The Infinite Grid
              </h1>
              <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                Move your cursor to reveal the active grid layer. <br/>
                The pattern scrolls infinitely in the background.
              </p>
            </div>
            
            <div className="flex gap-4 pointer-events-auto">
              <motion.button 
                  onClick={() => setCount(count + 1)}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -4,
                    backgroundColor: "#4338ca", // Indigo-700 (Deeper shift)
                    borderColor: "#6366f1",     // Indigo-500 border highlight
                    color: "#ffffff",
                    boxShadow: "0 25px 50px -12px rgba(67, 56, 202, 0.6)" // Pronounced shadow grow
                  }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-md border-2 border-transparent transition-colors"
              >
                  <MousePointerClick className="w-4 h-4" />
                  Interact ({count})
              </motion.button>
              
              <motion.button 
                  whileHover={{ 
                    scale: 1.05, 
                    y: -4, 
                    backgroundColor: "#6d28d9", // Violet-700 (Deeper shift)
                    borderColor: "#8b5cf6",     // Violet-500 border highlight
                    color: "#ffffff",
                    boxShadow: "0 25px 50px -12px rgba(109, 40, 217, 0.6)" // Pronounced shadow grow
                  }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="flex items-center gap-2 px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md border-2 border-transparent transition-colors"
              >
                  <Info className="w-4 h-4" />
                  Learn More
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync dark mode state with HTML class
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="w-full relative min-h-screen">
      {/* Sticky Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-background/50 backdrop-blur-sm border border-border shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Toggle Theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform" />
        )}
      </button>

      {/* Main Content */}
      <main>
        <InfiniteGrid />
      </main>

      {/* Footer Branding */}
      <footer className="fixed bottom-4 left-4 z-50 text-[10px] uppercase tracking-widest text-muted-foreground opacity-50 font-mono">
        Shadcn Infinite Grid v1.1
      </footer>
    </div>
  );
};

export default App;
