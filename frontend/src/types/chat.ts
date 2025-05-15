// Types related to the chat interface

// Structure for a chat message
export interface Message {
    sender: 'user' | 'bot';
    text: string;
    sources?: Source[]; // Optional: Store sources if returned
    evaluation?: string | null; // Optional: Store evaluation if returned
    processingTime?: number; // Optional: Store processing time
    model?: string; // Optional: Store model used
    isStreaming?: boolean; // Optional: Indicates if this message is currently streaming
}

// Structure for a source (based on backend response)
export interface Source {
    content: string;
    metadata: {
        title?: string;
        url?: string;
        [key: string]: any; // Allow other metadata fields
    };
}

// Structure for the available models from the backend
export interface Model {
    name: string;
    provider: string;
    description: string;
}

// Structure for the /api/models response
export interface ModelsResponse {
    models: Record<string, Model>;
    default: string;
} 