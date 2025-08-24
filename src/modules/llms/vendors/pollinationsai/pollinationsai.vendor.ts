import type { IModelVendor } from '../IModelVendor';
import type { DModelDomainId } from '~/common/stores/llms/model.domains.types';

// Define the specific access schema for Pollinations.ai
export interface DPollinationsAIAccess {
  pollinationsAIApiKey?: string;
  pollinationsAIApiHost?: string;
}

// Define the specific settings schema for Pollinations.ai
interface PollinationsAISettings {
  pollinationsAIApiKey?: string;
  pollinationsAIApiHost?: string;
}

// We might need an OpenAI-compatible access schema if the backend transport expects it
// Import OpenAIAccessSchema if needed for mapping Pollinations.ai access to it
import type { OpenAIAccessSchema } from '../../server/openai/openai.router';

export const ModelVendorPollinationsAI: IModelVendor<PollinationsAISettings, OpenAIAccessSchema> = {
  id: 'pollinations.ai',
  name: 'Pollinations.ai',
  displayRank: 10,
  location: 'cloud',
  // Assuming Pollinations.ai is a primary chat provider, but can also do image generation
  evalDomains: ['primaryChat', 'imageText'] as DModelDomainId[], // Add imageText domain

  initializeSetup: () => ({
    pollinationsAIApiKey: '',
    pollinationsAIApiHost: '', // Default host
  }),

  getTransportAccess: (partialSetup) => ({
    // Map Pollinations.ai specific settings to a transport access schema
    // that the backend can understand. Assuming an OpenAI-compatible transport.
    dialect: 'pollinations.ai', // Use a specific dialect for Pollinations.ai
    // Map Pollinations.ai key/host to oaiKey/oaiHost if the backend transport uses these names
    oaiKey: partialSetup?.pollinationsAIApiKey || '',
    oaiHost: partialSetup?.pollinationsAIApiHost || 'https://text.pollinations.ai',
    // Include other fields required by the transport access schema, if any
    oaiOrg: '', // Placeholder
    moderationCheck: false, // Placeholder
    heliKey: '', // Placeholder
  }),

  rpcUpdateModelsOrThrow: async (access) => {
    const host = access.oaiHost || 'https://text.pollinations.ai'; // Use the mapped host
    const apiKey = access.oaiKey; // Use the mapped key
    const textModelsUrl = `${host}/models`;
    const imageModelsUrl = `https://image.pollinations.ai/models`; // Use the specific image models endpoint

    const models: any[] = []; // Array to hold all fetched models

    // Fetch Text Models
    try {
      const textModelsResponse = await fetch(textModelsUrl, {
        headers: {
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        },
      });

      if (!textModelsResponse.ok) {
        console.warn(`Pollinations.AI Text Models API Error: ${textModelsResponse.status} ${textModelsResponse.statusText}`);
        // Continue without text models if fetching fails
      } else {
        const textModelsData = await textModelsResponse.json();
        // Transform text models data
        if (Array.isArray(textModelsData)) {
           textModelsData.forEach(model => {
              // Basic transformation - adapt property names and types based on API response
              models.push({
                id: model.id, // Assuming 'id' exists
                label: model.name || model.id, // Assuming 'name' or 'id' exists for label
                created: 0, updated: 0, // Placeholder dates
                description: model.description || '', // Assuming 'description' exists
                contextWindow: model.max_tokens || 8192, // Assuming 'max_tokens' exists, or use a default
                // Determine interfaces based on model capabilities in the API response
                interfaces: [
                  'oai-chat', // Assuming chat is supported
                  ...(model.capabilities?.includes('vision') ? ['oai-chat-vision'] : []),
                  ...(model.capabilities?.includes('function-calling') ? ['oai-chat-fn'] : []),
                   ...(model.capabilities?.includes('jsonMode') ? ['oai-chat-json'] : []), // Assuming jsonMode capability
                   ...(model.capabilities?.includes('speech-to-text') ? ['oai-chat-stt'] : []), // Assuming speech-to-text capability
                   ...(model.capabilities?.includes('text-to-speech') ? ['oai-chat-tts'] : []), // Assuming text-to-speech capability
                ] as ('oai-chat' | 'oai-chat-fn' | 'oai-chat-json' | 'oai-chat-vision' | 'oai-chat-reasoning' | 'oai-chat-stt' | 'oai-chat-tts')[], // Include new interfaces
                isChat: true, // Assume text models are chat models
                isHidden: false,
                isVision: model.capabilities?.includes('vision') || false,
                isTts: model.capabilities?.includes('text-to-speech') || false,
                isStt: model.capabilities?.includes('speech-to-text') || false,
                functionCalling: model.capabilities?.includes('function-calling') || false,
                pricing: { chatIn: 0, chatOut: 0 } as any, // TODO: Get actual pricing if available, otherwise use 0
              });
           });
        } else if (typeof textModelsData === 'object') {
           // If the API returns a dictionary of models
            Object.keys(textModelsData).forEach(modelId => {
               const model = textModelsData[modelId];
               models.push({
                 id: modelId,
                 label: model.name || modelId,
                 created: 0, updated: 0,
                 description: model.description || '',
                 contextWindow: model.max_tokens || 8192,
                  interfaces: [
                    'oai-chat',
                     ...(model.capabilities?.includes('vision') ? ['oai-chat-vision'] : []),
                     ...(model.capabilities?.includes('function-calling') ? ['oai-chat-fn'] : []),
                      ...(model.capabilities?.includes('jsonMode') ? ['oai-chat-json'] : []),
                      ...(model.capabilities?.includes('speech-to-text') ? ['oai-chat-stt'] : []),
                      ...(model.capabilities?.includes('text-to-speech') ? ['oai-chat-tts'] : []),
                   ] as ('oai-chat' | 'oai-chat-fn' | 'oai-chat-json' | 'oai-chat-vision' | 'oai-chat-reasoning' | 'oai-chat-stt' | 'oai-chat-tts')[],
                 isChat: true,
                 isHidden: false,
                 isVision: model.capabilities?.includes('vision') || false,
                 isTts: model.capabilities?.includes('text-to-speech') || false,
                 isStt: model.capabilities?.includes('speech-to-text') || false,
                 functionCalling: model.capabilities?.includes('function-calling') || false,
                 pricing: { chatIn: 0, chatOut: 0 } as any,
               });
            });
        }
      }

    } catch (textError) {
      console.error('Error fetching Pollinations.ai text models:', textError);
      // Don't re-throw, continue to fetch image models
    }

    // Fetch Image Models
    try {
       const imageModelsResponse = await fetch(imageModelsUrl, {
          headers: {
             ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
          },
       });

       if (!imageModelsResponse.ok) {
          console.warn(`Pollinations.AI Image Models API Error: ${imageModelsResponse.status} ${imageModelsResponse.statusText}`);
          // Continue without image models if fetching fails
       } else {
          const imageModelsData = await imageModelsResponse.json();
          if (Array.isArray(imageModelsData)) {
             imageModelsData.forEach(modelId => {
                models.push({ // Add image models to the same array
                   id: modelId, // Image model IDs are just strings
                   label: `Image: ${modelId}`, // Differentiate image models
                   created: 0, updated: 0,
                   description: `Pollinations.AI Image Model: ${modelId}`,
                   contextWindow: 0, // Image models don't have text context
                   interfaces: [], // Image models might not have standard OAI interfaces for chat, vision, etc.
                   isChat: false, // Image models are not chat models
                   isHidden: false,
                   isVision: true, // These are primarily for image generation, mark as vision capable for selection?
                   isTts: false,
                   isStt: false,
                   functionCalling: false,
                   pricing: { chatIn: 0, chatOut: 0 } as any, // TODO: Get actual pricing
                   // Add a specific property or interface to identify Image Generation models if needed later
                   // e.g., isImageGeneration: true,
                 });
             });
          } else {
             console.warn('Unexpected response format from Pollinations.ai image models endpoint.');
          }
       }
    } catch (imageError) {
       console.error('Error fetching Pollinations.ai image models:', imageError);
    }


    return { models: models as any }; // Return combined models
  },

  // Implement passthrough for handling API calls (assuming OpenAI compatibility for text/multimodal)
   passthrough: async (access, apiPath, apiSite, chatGenerateRequest, llmId) => {
     const host = access.oaiHost || 'https://text.pollinations.ai'; // Use the mapped host for text/multimodal
     const apiKey = access.oaiKey; // Use the mapped key

     let url = '';
     // Determine the correct endpoint based on the API path and potentially the model ID
     if (apiPath === '/chat/completions') {
        url = `${host}/openai`; // Use the OpenAI-compatible endpoint for chat completions
     } else if (apiPath.startsWith('/images/generations')) {
        // Handle image generation calls (if they go through the same passthrough)
        // The Pollinations.ai Image API uses a different endpoint structure (GET https://image.pollinations.ai/prompt/{prompt})
        // This passthrough might need to be adapted or a separate image generation logic might be needed elsewhere.
        // For now, throwing an error or logging a warning for image generation via this passthrough.
        console.error('Image generation through this passthrough is not directly supported by Pollinations.ai Image API structure.');
        throw new Error('Image generation via this method is not implemented for Pollinations.ai');
        // Alternatively, if a POST endpoint for image generation is available and OpenAI-compatible, use it here.
     } else if (apiPath === '/models') {
        // Model listing is handled by rpcUpdateModelsOrThrow, this case might not be needed here
         console.warn('Attempted to list models via passthrough - should use rpcUpdateModelsOrThrow instead.');
          throw new Error('Model listing via passthrough is not supported for Pollinations.ai');
     }
      else {
         // Handle other potential API paths if Pollinations.ai supports them
          url = `${host}${apiPath}`;
           console.warn(`Using generic passthrough for unexpected API path: ${apiPath}`);
     }

      if (!url) {
          throw new Error('Could not determine Pollinations.ai API endpoint for the given path.');
      }

     const headers: HeadersInit = {
       'Content-Type': 'application/json',
       ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
     };

     const response = await fetch(url, {
       method: 'POST', // Assuming most interactions via this passthrough are POST
       headers,
       body: JSON.stringify(chatGenerateRequest), // Pass the request body as is
     });

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Pollinations.AI API Error: ${response.status} ${response.statusText} - ${errorText}`);
     }

     return response;
   },

};