import { apiAsync } from '~/common/util/trpc.client';

import type { IModelVendor } from '../IModelVendor';
import type { OpenAIAccessSchema } from '../../server/openai/openai.router';


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
    // Pollinations.ai does not currently have a separate models list endpoint that
    // returns the same level of detail as OpenAI's /models.
    // We will hardcode a placeholder model for now.
    console.warn('Pollinations.ai does not have a standard /models endpoint for listing details. Using placeholder.');
    return {
      models: [{
        id: 'openai-audio', // Replace with an actual model ID if known
        label: 'OpenAI GPT-4o Mini Audio Preview',
        created: 0, updated: 0,
        description: 'A default text model from Pollinations.AI',
        contextWindow: 8192, // Placeholder context window
        interfaces: ['oai-chat'] as ('oai-chat' | 'oai-chat-fn' | 'oai-chat-json' | 'oai-chat-vision' | 'oai-chat-reasoning')[], // Assuming chat interface
        isChat: true,
        isHidden: false,
        isVision: true,
        isTts: true,
        isStt: true,
        functionCalling: true, // Assume no function calling for the default
        pricing: { chatIn: 0, chatOut: 0 } as any, // Unknown pricing - use any for now or define a proper pricing schema
      }],
    };
  },

  // Passthrough logic for Pollinations.ai (assuming OpenAI compatibility)
  passthrough: async (access, apiPath, apiSite, chatGenerateRequest, llmId) => {
    const host = access.oaiHost || 'https://text.pollinations.ai';
    const apiKey = access.oaiKey;
    // NOTE: Pollinations.ai uses PollinationsAIApiKey/Host in settings, but maps to oaiKey/oaiHost in access
    const url = `${host}${apiPath}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(chatGenerateRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pollinations.AI API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  },

};
