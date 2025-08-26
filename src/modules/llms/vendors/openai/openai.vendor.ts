import { apiAsync } from '~/common/util/trpc.client';

import type { IModelVendor } from '../IModelVendor';
import type { OpenAIAccessSchema } from '../../server/openai/openai.router';
import type { ModelDescriptionSchema } from '../../server/llm.server.types'; // Import ModelDescriptionSchema
import type { DLLM, DModelInterfaceV1 } from '~/common/stores/llms/llms.types'; // Import DModelInterfaceV1
import { LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn, LLM_IF_OAI_Json, LLM_IF_Outputs_Audio } from '~/common/stores/llms/llms.types'; // Import specific interfaces
import type { DModelDomainId } from '~/common/stores/llms/model.domains.types';

import { PollinationsaiWire_API_Models_List } from 'src/modules/pollinationsai/server/pollinationsai.wiretypes'; // Import Pollinations.ai wiretypes


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
    const textHost = access.oaiHost || 'https://text.pollinations.ai';
    const apiKey = access.oaiKey;

    const url = `${textHost}/models`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pollinations.AI API Error fetching models: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: PollinationsaiWire_API_Models_List.Model[] = await response.json(); // Assuming the response is an array of models

      // Map Pollinations.ai models to ModelDescriptionSchema
      const models: ModelDescriptionSchema[] = data.map(pollModel => {
        const modelId = pollModel.id;
        const modelLabel = pollModel.id; // Use id as label for now, or parse display_name if available

        // Determine interfaces based on model capabilities (refer to Pollinations.ai docs for actual capabilities)
        const interfaces: DModelInterfaceV1[] = [LLM_IF_OAI_Chat]; // Assume chat capability by default
        if (modelId.includes('vision')) interfaces.push(LLM_IF_OAI_Vision);
        if (modelId.includes('audio') || modelId === 'openai-audio') interfaces.push(LLM_IF_Outputs_Audio); // Assume audio output for openai-audio
        // Add other interface checks based on model ID or other properties if available

        return {
          id: modelId,
          label: modelLabel,
          created: 0, // Or map from Pollinations.ai data if available
          updated: 0, // Or map from Pollinations.ai data if available
          description: pollModel.id, // Use id as description for now, or parse from Pollinations.ai data
          contextWindow: 8192, // Placeholder context window - Update if Pollinations.ai provides this
          interfaces: interfaces,
          hidden: false,
          isVision: interfaces.includes(LLM_IF_OAI_Vision),
          isTts: interfaces.includes(LLM_IF_Outputs_Audio), // Assuming audio output implies TTS
          isStt: modelId.includes('audio') || modelId === 'openai-audio', // Assuming audio input implies STT
          functionCalling: modelId.includes('function'), // Assuming models with 'function' in ID support function calling
          pricing: { chatIn: 0, chatOut: 0 } as any, // Unknown pricing - Update if Pollinations.ai provides this
        };
      });

      return { models };

    } catch (error) {
      console.error('Error fetching Pollinations.ai models:', error);
      throw new Error(`Failed to fetch Pollinations.ai models: ${error}`);
    }
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

      // Always use the OpenAI-compatible POST endpoint for chat completions
     if (apiPath === '/chat/completions') {
        url = `${textHost}/openai`;
        method = 'POST';
        // The chatGenerateRequest (which is in OpenAI format) is already in the body
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
