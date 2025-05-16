'use client'

import { TiltedScroll } from "../ui/tilted-scroll";

const customItemsForTiltedScroll = [
  { id: "ts1", text: "Real-time Collaboration" },
  { id: "ts2", text: "Advanced AI Integrations" },
  { id: "ts3", text: "Scalable Infrastructure" },
  { id: "ts4", text: "Intuitive User Interface" },
  { id: "ts5", text: "Comprehensive Analytics" },
  { id: "ts6", text: "Secure Data Handling" },
  { id: "ts7", text: "Seamless Workflow Automation" },
  { id: "ts8", text: "Cross-Platform Compatibility" },
];

export function TiltedScrollDemoSection() {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-background rounded-xl shadow-lg w-full h-full">
      <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6 text-center">Dynamic Feature Showcase</h3>
      <TiltedScroll 
        items={customItemsForTiltedScroll}
      />
    </div>
  );
} 