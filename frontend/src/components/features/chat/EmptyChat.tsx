import React from 'react';
import { Button } from '@/components/ui/button';
import { useChatContext } from '@/contexts/ChatContext';
import { promptTemplates } from '@/config/provider-config';
import { TextShimmer } from '@/components/ui/text-shimmer';

// Version qui utilise le contexte
export function EmptyChat() {
  const { sendMessage } = useChatContext();
  
  return (
    <div className="flex flex-col flex-grow items-center justify-center p-6 text-center gap-16">
      <div className="pb-4">
        <TextShimmer
          duration={1.7}
          as="h1"
          className='text-3xl sm:text-4xl md:text-6xl font-medium leading-normal [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]'
        >
          Comment puis-je vous aider ?
        </TextShimmer>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl w-full mb-10">
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