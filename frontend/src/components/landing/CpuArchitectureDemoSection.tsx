'use client';

import { CpuArchitecture } from "@/components/ui/cpu-architecture";

// export function CpuArchitectureDemoSection() {
//   return (
//     <CpuArchitecture 
//         className="text-black dark:text-white w-full h-full"
//         lineMarkerSize={2.5}
//         text="CORE AI" // This was the previous text, will be updated if needed
//         textFontSize="5"
//     />
//   );
// } 

// New structure based on user's demo.tsx for "Page"
export function CpuArchitectureDemoSection() {
  return (
    // The user's demo had "p-4 rounded-xl bg-accent/20".
    // We removed this outer div in previous steps to make it fit the animation box.
    // The animation box in FeaturesBentoSection provides the background and padding now.
    // We pass necessary props to CpuArchitecture for styling and content.
    <CpuArchitecture 
        className="text-black dark:text-white w-full h-full" // For line colors, and to fill container
        lineMarkerSize={2.5} // Consistent with previous settings
        text="LOCAL" // As per user instruction for 3rd component text
        textFontSize="5"   // Consistent with previous settings
        // showCpuConnections, animateText, animateLines, animateMarkers will use defaults from new component
    />
  );
} 