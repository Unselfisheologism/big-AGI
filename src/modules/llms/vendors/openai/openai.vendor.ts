// src/modules/llms/vendors/openai/openai.vendor.ts

import { apiAsync } from '~/common/util/trpc.client';

import type { IModelVendor } from '../IModelVendor';
import type { OpenAIAccessSchema } from '../../server/openai/openai.router';
import type { ModelDescriptionSchema } from '../../server/llm.server.types'; // Import ModelDescriptionSchema
import type { DLLM, DModelInterfaceV1 } from '~/common/stores/llms/llms.types'; // Import specific interfaces
import { LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn, LLM_IF_OAI_Json, LLM_IF_Outputs_Audio } from '~/common/stores/llms/llms.types'; // Import specific interfaces
import type { DModelDomainId } from '~/common/stores/llms/model.domains.types';

// Remove the import for PollinationsaiWire_API_Models_List as we are not fetching the model list dynamically
// import { PollinationsaiWire_API_Models_List } from 'src/modules/pollinationsai/server/pollinationsai.wiretypes';


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
    oaiKey: '', // Pollinations.ai uses 'Authorization: Bearer' for tokens, map to oaiKey
    oaiOrg: '',
    oaiHost: '', // Pollinations.ai host, map to oaiHost
    heliKey: '',
    moderationCheck: false,
    ...partialSetup, // Include the partialSetup (Pollinations.ai specific settings)
    // Ensure that pollinationsAIApiKey and pollinationsAIApiHost from partialSetup
    // are correctly mapped to oaiKey and oaiHost in the returned object if needed.
    // Based on the PollinationsAIServiceSetup.tsx, these are already being mapped,
    // so no explicit mapping is needed here.
  }),

  // List Models
  rpcUpdateModelsOrThrow: async (access) => {
    // As per user's instruction and code's original intent, return hardcoded placeholder model.
    console.warn('Pollinations.ai does not have a standard /models endpoint for listing details. Using placeholder model definition.');
    return {
      models: [{
        id: 'llama-vision', // Use the preconfigured model ID
        label: 'Llama 3.2 11B Vision',
        created: 0, updated: 0,
        description: 'A default text model from Pollinations.AI',
        contextWindow: 8192, // Placeholder context window
        interfaces: [LLM_IF_OAI_Chat], // Assume chat and audio output
        hidden: false,
        isVision: true, // Assuming it has vision capabilities based on previous context
        functionCalling: true, // Assuming it has function calling capabilities
        pricing: { chatIn: 0, chatOut: 0 } as any, // Unknown pricing
      }],
    };
  },


  // Passthrough logic for Pollinations.ai
   passthrough: async (access, apiPath, apiSite, chatGenerateRequest, llmId) => {
     const textHost = access.oaiHost || 'https://text.pollinations.ai';
     const apiKey = access.oaiKey; // Use oaiKey for Pollinations.ai token

     let url = '';
     let method: 'POST' | 'GET' = 'GET'; // Set default method to GET
      let headers: HeadersInit = {
       // 'Content-Type': 'application/json', // Not needed for GET requests
       ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
     };
      let body: any = undefined; // No body for GET requests

      // Use the GET endpoint with prompt and model as URL parameters for chat completions
     if (apiPath === url ) { // This condition is correct, as apiPath from openAIAccess will be the base URL
        // method is already GET by default
        headers = {}; // Remove Content-Type for GET requests

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
        // Construct the final GET URL by appending prompt and model to the base URL
        url = `${apiPath}${encodedPrompt}?model=${llmId}`; // Use apiPath as the base URL

        // TODO: Add logic here to include other relevant parameters from chatGenerateRequest
        // like temperature, etc., as query parameters in the URL if supported by the GET endpoint.

     } else {
         // Throw an error for any other apiPath received by this Pollinations.ai passthrough
         throw new Error(`Unsupported API path for Pollinations.ai text generation: ${apiPath}`);
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
