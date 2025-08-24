import type { ModelDescriptionSchema } from '../../llm.server.types';
import {
  LLM_IF_OAI_Chat,
  LLM_IF_OAI_Vision,
  LLM_IF_Outputs_Audio,
  LLM_IF_OAI_NeedsAudio,
  LLM_IF_OAI_Fn,
  LLM_IF_OAI_Reasoning,
  LLM_IF_Tools_WebSearch,
} from '~/common/stores/llms/llms.types';
import { fromManualMapping } from './models.data';

// NOTE: These are manual mappings based on the provided documentation and model list.
// The actual models available via the Pollinations.AI API might vary.
// A more robust implementation would fetch the models list dynamically from
// https://text.pollinations.ai/models and map them accordingly.

const POLLINATIONS_MODELS: ModelDescriptionSchema[] = [
  // Text Models (from the provided JSON and documentation)
  {
    id: 'deepseek-reasoning',
    label: 'DeepSeek R1 0528 (Bedrock)',
    description: 'DeepSeek R1 0528 (Bedrock) - Reasoning model.',
    contextWindow: 10000, // Approximate, based on maxInputChars
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Reasoning],
    // Assuming pricing is handled by Pollinations tier, not per model
    // chatPrice: { input: 0, output: 0 },
  },
  {
    id: 'gemini',
    label: 'Gemini 2.5 Flash Lite (api.navy)',
    description: 'Gemini 2.5 Flash Lite (api.navy). Supports tools.',
    contextWindow: 128000, // Common for Gemini models, estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'gpt-5-nano',
    label: 'OpenAI GPT-5 Nano (Azure)',
    description: 'OpenAI GPT-5 Nano (Azure). Supports vision and tools.',
    contextWindow: 128000, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'llama-fast-roblox',
    label: 'Llama 3.2 1B (Cloudflare)',
    description: 'Llama 3.2 1B (Cloudflare). Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'llama-roblox',
    label: 'Llama 3.1 8B Instruct (Nebius)',
    description: 'Llama 3.1 8B Instruct (Nebius). Supports tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'llamascout',
    label: 'Llama 4 Scout 17B (Cloudflare)',
    description: 'Llama 4 Scout 17B (Cloudflare).',
    contextWindow: 131072, // Estimate
    interfaces: [LLM_IF_OAI_Chat],
  },
  {
    id: 'mistral',
    label: 'Mistral Small 3.1 24B (Scaleway)',
    description: 'Mistral Small 3.1 24B (Scaleway). Supports tools.',
    contextWindow: 32768, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'mistral-nemo-roblox',
    label: 'Mistral Nemo Instruct 2407 (Nebius)',
    description: 'Mistral Nemo Instruct 2407 (Nebius). Supports tools.',
    contextWindow: 32768, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'mistral-roblox',
    label: 'Mistral Small 3.1 24B (Cloudflare)',
    description: 'Mistral Small 3.1 24B (Cloudflare). Supports vision and tools.',
    contextWindow: 32768, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'nova-fast',
    label: 'Amazon Nova Micro (Bedrock)',
    description: 'Amazon Nova Micro (Bedrock). Supports tools.',
    contextWindow: 4096, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'openai',
    label: 'OpenAI GPT-4.1 Nano (Azure)',
    description: 'OpenAI GPT-4.1 Nano (Azure). Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'openai-audio',
    label: 'OpenAI GPT-4o Mini Audio Preview',
    description: 'OpenAI GPT-4o Mini Audio Preview. Supports audio (STT/TTS), vision, and tools.',
    contextWindow: 128000, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_NeedsAudio, LLM_IF_Outputs_Audio, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'openai-fast',
    label: 'OpenAI GPT-4.1 Nano Fast (Azure)',
    description: 'OpenAI GPT-4.1 Nano Fast (Azure). Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'openai-large',
    label: 'OpenAI GPT-4.1 (Azure)',
    description: 'OpenAI GPT-4.1 (Azure). Supports vision and tools.',
    contextWindow: 128000, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'openai-reasoning',
    label: 'OpenAI o3 (api.navy)',
    description: 'OpenAI o3 (api.navy) - Reasoning model. Supports tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Reasoning, LLM_IF_OAI_Fn],
  },
  {
    id: 'openai-roblox',
    label: 'OpenAI GPT-4.1 Nano (Azure)',
    description: 'OpenAI GPT-4.1 Nano (Azure). Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'qwen-coder',
    label: 'Qwen 2.5 Coder 32B (Scaleway)',
    description: 'Qwen 2.5 Coder 32B (Scaleway). Supports tools.',
    contextWindow: 32768, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'roblox-rp',
    label: 'Roblox RP Multi-Model (Bedrock)',
    description: 'Roblox RP Multi-Model (Bedrock). Supports tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'bidara',
    label: 'BIDARA (Biomimetic Designer and Research Assistant by NASA)',
    description: 'BIDARA (Biomimetic Designer and Research Assistant by NASA). Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'elixposearch',
    label: 'Elixpo Search',
    description: 'Elixpo Search - Search-augmented model.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_Tools_WebSearch], // Assuming search capability maps to WebSearch tool
  },
  {
    id: 'evil',
    label: 'Evil',
    description: 'Evil - Uncensored model. Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'midijourney',
    label: 'MIDIjourney',
    description: 'MIDIjourney - Music generation focused. Supports tools.',
    contextWindow: 4096, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'mirexa',
    label: 'Mirexa AI Companion',
    description: 'Mirexa AI Companion. Supports vision and tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'rtist',
    label: 'Rtist',
    description: 'Rtist - Creative writing focused. Supports tools.',
    contextWindow: 8192, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Fn],
  },
  {
    id: 'sur',
    label: 'Sur AI Assistant',
    description: 'Sur AI Assistant (Mistral-based). Supports vision and tools.',
    contextWindow: 32768, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },
  {
    id: 'unity',
    label: 'Unity Unrestricted Agent',
    description: 'Unity Unrestricted Agent - Uncensored model. Supports vision and tools.',
    contextWindow: 32768, // Estimate
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision, LLM_IF_OAI_Fn],
  },

  // Image Models (from the provided JSON and documentation)
  {
    id: 'flux',
    label: 'Flux',
    description: 'Latest stable diffusion model for image generation.',
    contextWindow: 0, // Image models don't have text context window
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision], // Can accept prompts (chat) and output images (vision for input, image output implicit in type)
    // Assuming pricing is handled by Pollinations tier, not per model
    // imagePrice: { creation: 0 },
  },
  {
    id: 'kontext',
    label: 'Kontext',
    description: 'Image generation model supporting image input for image-to-image tasks. Accepts image and text prompts and outputs images.',
    contextWindow: 0,
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision], // Can accept chat (text) and vision (image) input, image output implicit in type
    // imagePrice: { creation: 0 },
  },
  {
    id: 'turbo',
    label: 'Turbo',
    description: 'Fast image generation model.',
    contextWindow: 0, // Image models don't have text context window
    interfaces: [LLM_IF_OAI_Chat, LLM_IF_OAI_Vision], // Can accept prompts (chat) and output images (vision for input, image output implicit in type)
    // imagePrice: { creation: 0 },
  },

  // Audio Models (already covered by openai-audio in Text Models, but listing explicitly if there were others)
  // {
  //   id: 'some-other-audio-model',
  //   label: 'Some Other Audio Model',
  //   description: 'Description for another audio model.',
  //   contextWindow: 0, // Audio models may or may not have text context
  //   interfaces: [LLM_IF_OAI_Audio],
  // }
];


export function pollinationsModels(): ModelDescriptionSchema[] {
  // In a real dynamic implementation, you would fetch from
  // https://text.pollinations.ai/models here and map the response.
  // For this exercise, we return the hardcoded list.
  return POLLINATIONS_MODELS
    .map(model => fromManualMapping([], model.id, undefined, undefined))
    .filter(model => model.label !== undefined && model.label !== null); // Filter out models with undefined/null labels
}

export function pollinationsModelSort(a: ModelDescriptionSchema, b: ModelDescriptionSchema): number {
  // Basic sorting: prioritize models with interfaces, then alphabetically
  if (a.interfaces.length > 0 && b.interfaces.length === 0) return -1;
 if (a.interfaces.length === 0 && b.interfaces.length > 0) return 1;

  // Safely compare IDs
  const aId = a.id || ''; // Use empty string if id is missing
  const bId = b.id || ''; // Use empty string if id is missing

  // Ensure IDs are strings before localeCompare
  if (typeof aId !== 'string' || typeof bId !== 'string') return 0; // Cannot compare, consider them equal for sorting purposes
 return aId.localeCompare(bId);
}