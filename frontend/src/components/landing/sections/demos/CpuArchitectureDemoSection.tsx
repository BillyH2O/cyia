'use client';

import { CpuArchitecture } from "@/components/ui/cpu-architecture";

export function CpuArchitectureDemoSection() {
  return (

    <CpuArchitecture 
        className="text-black dark:text-white w-full h-full" 
        lineMarkerSize={2.5} 
        text="CUDA "
        textFontSize="6"   
        showCpuConnections={true}
        animateText={true}
        animateLines={true}
        animateMarkers={true}
        // showCpuConnections, animateText, animateLines, animateMarkers will use defaults from new component
    />
  );
} 