"use client"
import * as React from "react"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  pauseOnHover?: boolean
  direction?: "left" | "right"
  speed?: number
}

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 30,
  className,
  ...props
}: MarqueeProps) {
  return (
    <div className={`w-full overflow-hidden ${className || ""}`} {...props}>
      <div className="relative flex overflow-hidden py-3">
        <div
          className={[
            "flex w-max",
            direction === "right" ? "animate-marquee-reverse" : "animate-marquee",
            pauseOnHover ? "hover:[animation-play-state:paused]" : "",
          ].join(" ")}
          style={{ "--duration": `${speed}s` } as React.CSSProperties}
        >
          {children}
          {children}
        </div>
      </div>
    </div>
  )
}
