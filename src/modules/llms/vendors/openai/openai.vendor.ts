import { apiAsync } from '~/common/util/trpc.client';

import type { IModelVendor } from '../IModelVendor';
import type { OpenAIAccessSchema } from '../../server/openai/openai.router';
import type { ModelDescriptionSchema } from '../../server/llm.server.types'; // Import ModelDescriptionSchema
import type { DLLM, DModelInterfaceV1 } from '~/common/stores/llms/llms.types'; // Import DModelInterfaceV1
import { LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn, LLM_IF_OAI_Json, LLM_IF_Outputs_Audio } from '~/common/stores/llms/llms.types'; // Import specific interfaces
import type { DModelDomainId } from '~/common/stores/llms/model.domains.types';


// special symbols
// export const isValidOpenAIApiKey = (apiKey?: string) => !!apiKey && apiKey.startsWith('sk-') && apiKey.length > 40;

export interface DPollinationsAIAccess {
  pollinationsAIApiKey?: string;
  pollinationsAIApiHost?: string;
}

export const ModelVendorPollinationsAI: IModelVendor<DPollinationsAIAccess, OpenAIAccessSchema> = {
  id: 'pollinations.ai',
  name: 'Pollinations.AI',
  displayRank: 10,
  location: 'cloud',


  // functions
  getTransportAccess: (partialSetup): OpenAIAccessSchema => ({
    dialect: 'pollinations.ai', // Use the correct dialect for Pollinations.ai
    oaiKey: '',
    oaiOrg: '',
    oaiHost: '',
    heliKey: '',
    moderationCheck: false,
    ...partialSetup, // Include the partialSetup (Pollinations.ai specific settings)
  }),

  // List Models
  rpcUpdateModelsOrThrow: async (access) => {
    // As per user's instruction, do not fetch the models list.
    // Keep the placeholder model for now to avoid breaking the model selection UI.
    console.warn('Pollinations.ai does not have a standard /models endpoint for listing details. Using placeholder model definition.');
    return {
      models: [{
        id: 'openai-audio', // Use the preconfigured model ID
        label: 'OpenAI GPT-4o Mini Audio Preview',
        created: 0, updated: 0,
        description: 'A default text model from Pollinations.AI',
        contextWindow: 8192, // Placeholder context window
        interfaces: [LLM_IF_OAI_Chat, LLM_IF_Outputs_Audio], // Assume chat and audio output
        hidden: false,
        isVision: true, // Assuming it has vision capabilities based on previous context
        isTts: true, // Mark as TTS capable
        isStt: true, // Mark as STT capable
        functionCalling: true, // Assuming it has function calling capabilities
        pricing: { chatIn: 0, chatOut: 0 } as any, // Unknown pricing
      }],
    };
  },

  // Passthrough logic for Pollinations.ai
   passthrough: async (access, apiPath, apiSite, chatGenerateRequest, llmId) => {
     const textHost = access.oaiHost || 'https://text.pollinations.ai';
     const apiKey = access.oaiKey;

     let url = '';
     let method: 'POST' | 'GET' = 'POST'; // Default method
      let headers: HeadersInit = {
       'Content-Type': 'application/json',
       ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
     };
      let body: any = JSON.stringify(chatGenerateRequest); // Default body

     // Handle the specific case for 'openai-audio' and chat completions using GET to root endpoint
     if (llmId === 'openai-audio' && apiPath === '/chat/completions') {
        console.warn('Handling openai-audio chat completion with Pollinations.ai GET endpoint.');
        method = 'GET';
        headers = {}; // GET requests typically don't need Content-Type application/json
        body = undefined; // GET requests do not have a body

        // Extract prompt from the chatGenerateRequest (assuming it's in the messages array)
        let prompt = '';
        const messages = (chatGenerateRequest as any)?.messages;
        if (Array.isArray(messages)) {
            for (const message of messages) {
                if (message.role === 'user' && typeof message.content === 'string') {
                    prompt = message.content; // Take the first user message content as the prompt
                    break;
                }
            }
        }

        if (!prompt) {
            throw new Error('Text generation requires a text prompt in the user message.');
        }

        const encodedPrompt = encodeURIComponent(prompt);
        // Construct the GET URL for text/audio generation
        url = `${textHost}/${encodedPrompt}?model=${llmId}`; // Include model parameter

        // TODO: Add logic here to include other relevant parameters from chatGenerateRequest
        // like 'voice' for audio generation if needed, and other text generation parameters
        // like temperature, etc., as query parameters in the URL.

     } else if (apiPath === '/chat/completions') {
        // Default handling for other models using the OpenAI-compatible POST endpoint
        url = `${textHost}/openai`;
        method = 'POST';
     } else if (apiPath === '/models') {
        // Model listing is handled by rpcUpdateModelsOrThrow
         console.warn('Attempted to list models via passthrough - should use rpcUpdateModelsOrThrow instead.');
          throw new Error('Model listing via passthrough is not supported for Pollinations.ai');
     }
      else {
         // Handle other potential API paths if Pollinations.ai supports them
          url = `${textHost}${apiPath}`;
           console.warn(`Using generic passthrough for unexpected API path: ${apiPath}`);
     }

      if (!url) {
          throw new Error('Could not determine Pollinations.ai API endpoint for the given path.');
      }

     const response = await fetch(url, {
       method: method,
       headers,
       body: body,
     });

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Pollinations.AI API Error: ${response.status} ${response.statusText} - ${errorText}`);
     }

     return response;
   },

};
