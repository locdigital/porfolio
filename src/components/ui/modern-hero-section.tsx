import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'framer-motion';

export interface HeroCollageProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  subtitle: string;
  stats: { value: string; label: string }[];
  images: string[];
}

const HeroCollage = React.forwardRef<HTMLDivElement, HeroCollageProps>(
  ({ className, title, subtitle, stats, images, ...props }, ref) => {
    const displayImages = images.slice(0, 7);

    // Configuration for floating images
    const imageConfigs = [
      { // 0: Central
        className: "absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 z-20",
        delay: 0,
        yOffset: -20,
      },
      { // 1: Top-Left
        className: "absolute left-[22%] top-[15%] w-52 z-10",
        delay: 1.2,
        yOffset: -15,
      },
      { // 2: Top-Right
        className: "absolute right-[24%] top-[10%] w-48 z-10",
        delay: 2.5,
        yOffset: -25,
      },
      { // 3: Bottom-Right
        className: "absolute right-[20%] bottom-[12%] w-60 z-30",
        delay: 3.5,
        yOffset: -18,
      },
      { // 4: Far-Right
        className: "absolute right-[5%] top-1/2 -translate-y-[60%] w-52 z-10",
        delay: 4.8,
        yOffset: -22,
      },
      { // 5: Bottom-Left
        className: "absolute left-[18%] bottom-[8%] w-56 z-30",
        delay: 5.2,
        yOffset: -16,
      },
      { // 6: Far-Left
        className: "absolute left-[5%] top-[25%] w-48 z-10",
        delay: 0.8,
        yOffset: -20,
      }
    ];

    return (
      <section
        ref={ref}
        className={cn(
          'relative w-full bg-transparent font-sans py-20 sm:py-32 overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Main Content */}
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 font-serif"
          >
            {title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-gray-600"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Image Collage */}
        <div className="relative z-0 mt-20 h-[600px] flex items-center justify-center">
          <div className="relative h-full w-full max-w-6xl">
            {displayImages.map((src, idx) => {
              const config = imageConfigs[idx];
              if (!config) return null;
              
              return (
                <motion.div
                  key={idx}
                  className={cn("h-auto rounded-2xl shadow-2xl object-cover", config.className)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, config.yOffset, 0]
                  }}
                  transition={{ 
                    opacity: { duration: 0.4, delay: idx * 0.05 },
                    scale: { duration: 0.4, delay: idx * 0.05, type: "spring", bounce: 0.4 },
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: config.delay
                    }
                  }}
                >
                  <img
                    src={src}
                    alt={`Workflow feature ${idx + 1}`}
                    className="w-full h-full object-cover rounded-2xl"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="container relative z-10 mx-auto mt-16 px-4">
          <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
            {stats.map((stat, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                key={index} 
                className="text-center"
              >
                <p className="text-4xl font-bold tracking-tight text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }
);

HeroCollage.displayName = 'HeroCollage';
export { HeroCollage };
