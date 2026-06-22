import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { User, Briefcase, Zap, Camera, Laptop, Sparkles } from "lucide-react"

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  gradient: string
  iconColor: string
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  pathname?: string
  onItemClick?: (label: string) => void
}

const menuItems: MenuItem[] = [
  {
    icon: User,
    label: "About",
    href: "/about",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: Briefcase,
    label: "Work",
    href: "/work",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: Zap,
    label: "Services",
    href: "/service",
    gradient:
      "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-500",
  },

  {
    icon: Camera,
    label: "Photos",
    href: "/photos",
    gradient:
      "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
  {
    icon: Laptop,
    label: "Gear",
    href: "/gear",
    gradient:
      "radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(13,148,136,0.06) 50%, rgba(15,118,110,0) 100%)",
    iconColor: "text-teal-500",
  },
  {
    icon: Sparkles,
    label: "Ask ✦",
    href: "/question",
    gradient:
      "radial-gradient(circle, rgba(0,117,222,0.15) 0%, rgba(0,117,222,0.06) 50%, rgba(0,117,222,0) 100%)",
    iconColor: "text-[#0075de]",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: 0, opacity: 1 },
}

const backVariants = {
  initial: { rotateX: 0, opacity: 0 },
  hover: { rotateX: 0, opacity: 0 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 1 },
  hover: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0,
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
}

const sharedTransition = {
  duration: 0,
}

const getActiveItem = (path: string) => {
  if (path.startsWith('/about')) return "About";
  if (path.startsWith('/work')) return "Work";
  if (path.startsWith('/service')) return "Services";
  if (path.startsWith('/blog')) return "Writing";
  if (path.startsWith('/photos') || path.startsWith('/gallery')) return "Photos";
  if (path.startsWith('/gear')) return "Gear";
  if (path.startsWith('/question')) return "Ask ✦";
  return "";
}

export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
  ({ className, pathname = "", onItemClick, ...props }, ref) => {
    const activeItem = getActiveItem(pathname)

    return (
      <motion.nav
        ref={ref}
        className={cn(
          "p-1 rounded-2xl bg-gradient-to-b from-white/90 to-[#FAFAF7]/60 backdrop-blur-md border border-[#E8E8E2]/60 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden",
          className
        )}
        initial="initial"
        whileHover="hover"
        {...props}
      >
        <motion.div
          className="absolute -inset-2 rounded-3xl z-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(0, 117, 222, 0.08) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(239, 68, 68, 0.02) 80%, transparent 100%)"
          }}
          variants={navGlowVariants}
        />
        <ul className="flex items-center gap-1.5 relative z-10 m-0 p-0 list-none">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.label === activeItem

            return (
              <motion.li key={item.label} className="relative">
                <a
                  href={item.href}
                  onClick={() => onItemClick?.(item.label)}
                  className="block text-inherit no-underline select-none"
                >
                  <motion.div
                    className="block rounded-xl overflow-visible group relative cursor-pointer"
                    style={{ perspective: "600px" }}
                    whileHover="hover"
                    initial="initial"
                  >
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none"
                      variants={glowVariants}
                      animate={isActive ? "hover" : "initial"}
                      style={{
                        background: item.gradient,
                        opacity: isActive ? 1 : 0,
                        borderRadius: "12px",
                      }}
                    />
                    {/* Front side (Default view) */}
                    <motion.div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 relative z-10 bg-transparent transition-colors rounded-xl font-sans text-xs font-medium",
                        isActive
                          ? "text-black"
                          : "text-neutral-500 group-hover:text-black",
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center bottom",
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300",
                          isActive ? item.iconColor : "text-neutral-500 group-hover:text-black",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </motion.div>
                    
                    {/* Back side (Hover view) */}
                    <motion.div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 absolute inset-0 z-10 bg-transparent transition-colors rounded-xl font-sans text-xs font-medium",
                        isActive
                          ? "text-black"
                          : "text-neutral-500 group-hover:text-black",
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center top",
                        rotateX: 90,
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300",
                          item.iconColor,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </motion.div>
                  </motion.div>
                </a>
              </motion.li>
            )
          })}
        </ul>
      </motion.nav>
    )
  }
)

MenuBar.displayName = "MenuBar"
