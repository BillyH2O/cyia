"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AppScreenshotSkewedProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const AppScreenshotSkewed = ({ className, ...props }: AppScreenshotSkewedProps) => {
  return (
    <div 
      className={cn("relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] overflow-hidden", className)} 
      {...props}
    >
      <div className="[perspective:1200px] relative w-full h-full scale-[0.75] sm:scale-90 md:scale-95 lg:scale-100">
        <div className="[transform:rotateX(20deg)] h-full w-full">
          <div className="relative h-full w-full skew-x-[.36rad]">
            <img
              src="/dashboard.png"
              alt="Dashboard preview"
              className="rounded-[--radius] z-[2] relative border w-full h-auto object-cover shadow-xl"
              width={2880}
              height={2074}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppScreenshotSkewed; 