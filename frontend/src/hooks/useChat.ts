import { useState, useCallback, useEffect } from 'react';
import type { Message, Model, Source } from '../types/chat';

interface MessageResponse {
  role: string;
  content: string;
  sources?: Source[];
  processingTime?: number;
  model?: string;
}

interface ModelsResponse {
  models: Record<string, Model>;
  default: string;
}

export function useChat(initialChatId?: string | null) {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [evaluateSources, setEvaluateSources] = useState<boolean>(false);
  const [useReranker, setUseReranker] = useState<boolean>(true);
  const [useStreaming, setUseStreaming] = useState<boolean>(true);
  const [useMultiQuery, setUseMultiQuery] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [topP, setTopP] = useState<number | null>(null);
  const [topK, setTopK] = useState<number | null>(null);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number | null>(null);
  const [presencePenalty, setPresencePenalty] = useState<number | null>(null);
  const [repetitionPenalty, setRepetitionPenalty] = useState<number | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [retrievalK, setRetrievalK] = useState<number | null>(null);
  const [rerankK, setRerankK] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<Record<string, Model>>({});
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId === undefined ? null : initialChatId);
  const [isOptionsVisible, setIsOptionsVisible] = useState<boolean>(true);

  // Determine if we are in playground mode
  const isPlayground = initialChatId === null;

  // Calculate if chat is empty and not loading
  const isChatEmpty = messages.length === 0 && !isLoadingMessages && !isSending;

  // Fetch available models
  const fetchAvailableModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      const backendBaseUrl = process.env.NEXT_PUBLIC_RAG_BASE_URL || 'http://localhost:5000';
      console.log("Debug - Attempting to fetch models from:", `${backendBaseUrl}/api/models`);
      const response = await fetch(`${backendBaseUrl}/api/models`);

      if (!response.ok) {
        console.error('Failed to fetch models:', response.statusText);
        setMessages((prev) => [...prev, { sender: 'bot', text: `Error fetching models: ${response.statusText}` }]);
        return;
      }

      const data: ModelsResponse = await response.json();
      setAvailableModels(data.models);

      // Prioritise "mistral" if available, otherwise backend default, otherwise first model
      if (data.models['mistral']) {
        setSelectedModel('mistral');
      } else if (data.models[data.default]) {
        setSelectedModel(data.default);
      } else if (Object.keys(data.models).length > 0) {
        setSelectedModel(Object.keys(data.models)[0]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: "No models available from the backend." }]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, { sender: 'bot', text: `Error fetching models: ${errorMsg}` }]);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  // Fetch messages for selected chat
  const fetchMessagesForChat = useCallback(async (chatId: string) => {
    if (!chatId) return;
    setIsLoadingMessages(true);
    setMessages([]); // Clear previous messages
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      console.log('Réponse complète du backend:', data);
      // Adapt fetched messages to the Message type
      const formattedMessages = data.map((msg: MessageResponse) => ({
        sender: msg.role === 'user' ? 'user' : 'bot',
        text: msg.content,
        sources: msg.sources,
        processingTime: msg.processingTime,
        model: msg.model,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([{ sender: 'bot', text: 'Erreur lors du chargement des messages.' }]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // --- Function to log analytics data ---
  const logAnalytics = useCallback(async (logData: { 
    modelUsed: string;
    wasStreaming: boolean;
    processingTime?: number;
    chatId: string;
    promptTokens?: number;  
    completionTokens?: number;
    totalTokens?: number;
    cost?: number;
  }) => {
    // Skip logging in playground mode or if chatId is missing
    if (isPlayground || !logData.chatId) {
      console.log("Analytics logging skipped (Playground mode or missing chatId).");
      return;
    }

    try {
      await fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logData,
          // Get current state values for options
          evaluateSources: evaluateSources,
          useReranker: useReranker,
          useMultiQuery: useMultiQuery,
          temperature: temperature,
          topP: topP,
          topK: topK,
          frequencyPenalty: frequencyPenalty,
          presencePenalty: presencePenalty,
          repetitionPenalty: repetitionPenalty,
          seed: seed,
        }),
      });
    } catch (error) {
      console.error('Failed to log analytics data:', error); 
    }
  }, [isPlayground, evaluateSources, useReranker, useMultiQuery, temperature, topP, topK, frequencyPenalty, presencePenalty, repetitionPenalty, seed]);

  // Handle sending a message
  const sendMessage = async (promptText?: string) => {
    const messageToSend = promptText || input;
    if (!messageToSend.trim() || isSending || !selectedModel) return;

    const userMessage: Message = { sender: 'user', text: messageToSend };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = messageToSend;
    setInput(''); 
    setIsSending(true);

    try {
      const endpoint = useStreaming ? '/api/chat/stream' : '/api/chat/send';
      const payload = {
        question: currentInput,
        evaluate_sources: evaluateSources,
        use_reranker: useReranker,
        use_multi_query: useMultiQuery,
        model: selectedModel,
        // Only include chatId if NOT in playground mode
        ...(!isPlayground && currentChatId && { chatId: currentChatId }), 
        temperature: temperature,
        ...(topP !== null && { top_p: topP }),
        ...(topK !== null && { top_k: topK }),
        ...(frequencyPenalty !== null && { frequency_penalty: frequencyPenalty }),
        ...(presencePenalty !== null && { presence_penalty: presencePenalty }),
        ...(repetitionPenalty !== null && { repetition_penalty: repetitionPenalty }),
        ...(seed !== null && { seed: seed }),
        ...(retrievalK !== null && { k: retrievalK }),
        ...(rerankK !== null && { rerank_k: rerankK }),
      };

      if (useStreaming) {
        // Pass isPlayground to streamSend
        await streamSend(currentInput, endpoint, isPlayground, payload); 
        return;
      }

      // Non-streaming request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = `Error: ${response.status} ${response.statusText}. ${data?.error || 'Could not reach the send API.'}`;
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: errorMessage }]);
      } else {
        const botMessage: Message = {
          sender: 'bot',
          text: data.text,
          sources: data.sources,
          evaluation: data.evaluation,
          processingTime: data.processingTime,
          model: data.model,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        
        // Do NOT update chatId if in playground mode
        if (!isPlayground && !currentChatId && data.chatId) {
          setCurrentChatId(data.chatId);
        }

        // Log analytics only if not in playground
        if (!isPlayground && response.ok) {
          const finalChatId = currentChatId || data.chatId;
          if (finalChatId) {
            logAnalytics({
              modelUsed: selectedModel,
              wasStreaming: false,
              processingTime: data.processingTime,
              chatId: finalChatId,
              promptTokens: data.prompt_tokens,
              completionTokens: data.completion_tokens,
              totalTokens: data.total_tokens,
              cost: data.cost
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessageText = 'Failed to fetch response from the send API.';
      if (error instanceof Error) {
        errorMessageText += ` Details: ${error.message}`;
      }
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: errorMessageText }]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle chat selection (shouldn't be called in playground, but check anyway)
  const selectChat = (chatId: string | null) => {
    if (isPlayground) return; // Prevent selecting chats in playground
    if (chatId !== currentChatId) {
      setCurrentChatId(chatId);
    }
  };

  // Create new chat (modified for playground)
  const createNewChat = () => {
    if (!isPlayground) { // Only reset chatId if not in playground
       setCurrentChatId(null);
    }
    setMessages([]);
    setInput('');
  };

  // Delete chat (shouldn't be callable from playground UI)
  const deleteChat = async (chatId: string) => {
    if (isPlayground || !chatId) return; // Prevent deleting in playground
    if (!chatId) return;
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete chat');
      }
      
      // If the deleted chat was the current one, create a new chat
      if (currentChatId === chatId) {
        createNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: `Erreur lors de la suppression du chat: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]);
    }
  };

  // Load models on mount
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  // Load messages when chat changes, only if not playground
  useEffect(() => {
    // Only fetch messages if we have a chatId AND are not in playground mode
    if (currentChatId && !isPlayground) {
      fetchMessagesForChat(currentChatId);
    } else {
      // Clear messages if chatId becomes null (e.g., new chat) or if in playground
      setMessages([]); 
    }
    // Dependency array includes isPlayground now
  }, [currentChatId, fetchMessagesForChat, isPlayground]);

  // --- Streaming implementation (needs modification) ---
  // Pass isPlayground and payload to streamSend
  const streamSend = async (
    questionText: string, 
    endpointUrl: string, 
    isPlayground: boolean, 
    payload: Record<string, unknown>
  ) => { 
    // 1. Add bot placeholder message immediately with the model info
    const userMessageIndex = messages.length; // L'index du message utilisateur qu'on vient d'ajouter
    const botPlaceholderIndex = userMessageIndex; // Utiliser un index fixe pour le placeholder du bot
    
    // Créer un message bot initial avec le modèle déjà défini
    setMessages((prev) => {
      // S'assurer que le message bot n'existe pas déjà
      const updatedMessages = [...prev];
      updatedMessages.push({ 
        sender: 'bot', 
        text: '', 
        model: selectedModel,
        isStreaming: true
      });
      return updatedMessages;
    });

    // Variables pour suivre les métadonnées qui arrivent durant le streaming
    let streamedText = '';
    let sourceData: Source[] | undefined = undefined;
    let evaluationData: string | null = null;
    let processingTime: number | null = null;
    const streamStartTime = Date.now();
    // Token metrics from metadata
    const tokenMetadata = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0
    };

    let finalChatIdForAnalytics: string | null = isPlayground ? null : currentChatId;

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use the pre-constructed payload
        body: JSON.stringify(payload),
      });

      if (!response.body) {
        throw new Error('Streaming not supported by browser or no body.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Traiter les lignes complètes
        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;
          
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          // Ignorer les commentaires SSE qui commencent par ":"
          if (line.startsWith(':')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            // Marquer la fin du stream avec [DONE]
            if (data === '[DONE]') {
              break;
            }

            try {
              // Essayer de parser comme JSON pour détecter les métadonnées
              const jsonData = JSON.parse(data);
              
              // Si c'est un événement de métadonnées avec des sources ou une évaluation
              if (jsonData.type === 'metadata') {
                if (jsonData.sources) sourceData = jsonData.sources;
                if (jsonData.evaluation) evaluationData = jsonData.evaluation;
                if (jsonData.processingTime) processingTime = jsonData.processingTime;
                // Capture token metrics from metadata
                if (jsonData.promptTokens) tokenMetadata.promptTokens = jsonData.promptTokens;
                if (jsonData.completionTokens) tokenMetadata.completionTokens = jsonData.completionTokens;
                if (jsonData.totalTokens) tokenMetadata.totalTokens = jsonData.totalTokens;
                if (jsonData.cost) tokenMetadata.cost = jsonData.cost;
                // Crucially, DO NOT update currentChatId from metadata in playground mode
                if (!isPlayground && jsonData.chatId && !finalChatIdForAnalytics) {
                  finalChatIdForAnalytics = jsonData.chatId; 
                  // We don't setCurrentChatId here during stream, only use for analytics later
                }
                continue;
              }
              
              // Si on a des données de texte
              if (jsonData.content) {
                streamedText += jsonData.content;
              }
            } catch {
              // Si ce n'est pas du JSON, c'est du texte simple. C'est un comportement attendu
              // pour les fragments de contenu textuel pur envoyés par le backend.
              streamedText += data;
            }

            // Mettre à jour le message avec le nouveau texte et les métadonnées disponibles
            setMessages((prev) => {
              const updated = [...prev];
              // Vérifier que nous avons le bon nombre de messages
              if (updated.length > botPlaceholderIndex && updated[updated.length - 1].isStreaming) {
                // Mettre à jour seulement le dernier message qui est en streaming
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  text: streamedText,
                  sources: sourceData,
                  evaluation: evaluationData,
                  processingTime: processingTime || (Date.now() - streamStartTime) / 1000,
                  isStreaming: true
                };
              }
              return updated;
            });
          }
        }
      }

      // Message final avec toutes les métadonnées et le status de streaming désactivé
      setMessages((prev) => {
        const updated = [...prev];
        // Vérifier que nous avons le bon nombre de messages
        if (updated.length > botPlaceholderIndex && updated[updated.length - 1].isStreaming) {
          // Mettre à jour seulement le dernier message qui est en streaming
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: streamedText,
            sources: sourceData,
            evaluation: evaluationData,
            processingTime: processingTime || (Date.now() - streamStartTime) / 1000,
            isStreaming: false // Le streaming est terminé
          };
        }
        return updated;
      });

      // Log analytics only if not in playground and we have a chat ID
      if (!isPlayground && finalChatIdForAnalytics) { 
         logAnalytics({
            modelUsed: selectedModel, 
            wasStreaming: true,
            processingTime: processingTime || (Date.now() - streamStartTime) / 1000,
            chatId: finalChatIdForAnalytics, // Use the ID determined during stream/initial state
            promptTokens: tokenMetadata.promptTokens,
            completionTokens: tokenMetadata.completionTokens,
            totalTokens: tokenMetadata.totalTokens,
            cost: tokenMetadata.cost
          });
      } else if (!isPlayground && !finalChatIdForAnalytics) {
         console.warn("Analytics not logged for streamed chat: Chat ID could not be determined.");
      } // No warning needed for playground mode

    } catch (error: unknown) {
      console.error('Streaming error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > botPlaceholderIndex && updated[updated.length - 1].isStreaming) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: streamedText || 'Erreur lors du streaming.',
            isStreaming: false
          };
        } else {
          updated.push({ 
            sender: 'bot', 
            text: 'Erreur lors du streaming.' 
          });
        }
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  };

  // Fonction pour basculer la visibilité du panneau d'options
  const toggleOptionsVisibility = () => {
    setIsOptionsVisible(prev => !prev);
  };

  return {
    // State
    input,
    messages,
    isSending,
    isLoadingMessages,
    evaluateSources,
    useReranker,
    useStreaming,
    useMultiQuery,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    repetitionPenalty,
    seed,
    retrievalK,
    rerankK,
    availableModels,
    selectedModel,
    isLoadingModels,
    currentChatId,
    isChatEmpty,
    isPlayground,
    isOptionsVisible,
    
    // Actions
    setInput,
    setEvaluateSources,
    setUseReranker,
    setUseStreaming,
    setUseMultiQuery,
    setTemperature,
    setSelectedModel,
    setTopP,
    setTopK,
    setFrequencyPenalty,
    setPresencePenalty,
    setRepetitionPenalty,
    setSeed,
    setRetrievalK,
    setRerankK,
    sendMessage,
    selectChat,
    createNewChat,
    deleteChat,
    toggleOptionsVisibility,
  };
} 