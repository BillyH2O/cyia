import React from 'react';
import { Button } from '@/components/ui/button';
import { useChatContext } from '@/contexts/ChatContext';
import { promptTemplates } from '@/config/provider-config';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { SplineScene } from "@/components/ui/spline-scene";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";

export function EmptyChat() {
  const { sendMessage } = useChatContext();
  
  return (
    <div className="flex flex-col flex-grow items-center justify-center p-6 text-center gap-4">
      
      <div className="w-full max-w-[400px] sm:max-w-xl sm:mt-10">
          <Card className="w-full h-[400px] md:h-[400px] bg-black/[0.96] relative overflow-hidden">
            <Spotlight
              className="-top-40 left-0 md:left-30 md:-top-20"
              fill="white"
            />
            <div className="relative h-full w-full">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="!w-full !h-full absolute top-0 left-0"
              />
            </div>
          </Card>
        </div>
        
      <div>
        <TextShimmer
          duration={1.7}
          as="h1"
          className='text-3xl sm:text-4xl xl:text-6xl font-medium leading-normal [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]'
        >
          Comment puis-je vous aider ?
        </TextShimmer>
      </div>
    
      <div className="hidden xl:grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl w-full mb-10">
        {promptTemplates.map((prompt, index) => (
          <div key={index} className="w-full overflow-hidden">
            <Button
              variant="outline"
              className="w-full h-auto p-4 text-left justify-start"
              onClick={() => sendMessage(prompt)}
              title={prompt}
            >
              <span className="block truncate">{prompt}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 