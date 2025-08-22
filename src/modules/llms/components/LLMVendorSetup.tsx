import * as React from 'react';

import type { DModelsService, DModelsServiceId } from '~/common/stores/llms/llms.service.types';

import { findModelVendor, ModelVendorId } from '../vendors/vendors.registry';


// direct imports for all vendor setup components - NOTE: we could lazy load if this becomes a performance issue
import { LocalAIServiceSetup } from '../vendors/localai/LocalAIServiceSetup';
import { PollinationsAIServiceSetup } from '../vendors/pollinationsai/PollinationsAIServiceSetup';


/**
 * Add to this map to register a new Vendor Setup Component.
 * NOTE: we do it here to only depend on this file (even lazily) and avoid to import all the Components (UI)
 *       code on vendor definitions (which must be lightweight as it impacts boot time).
 */
const vendorSetupComponents: Record<ModelVendorId, React.ComponentType<{ serviceId: DModelsServiceId }>> = {
  // Keep LocalAI
  localai: LocalAIServiceSetup,

  // Map all other providers to PollinationsAIServiceSetup
  alibaba: PollinationsAIServiceSetup,
  anthropic: PollinationsAIServiceSetup,
  azure: PollinationsAIServiceSetup,
  deepseek: PollinationsAIServiceSetup,
  googleai: PollinationsAIServiceSetup,
  groq: PollinationsAIServiceSetup,
  lmstudio: PollinationsAIServiceSetup,
  mistral: PollinationsAIServiceSetup,
  ollama: PollinationsAIServiceSetup,
  openai: PollinationsAIServiceSetup, // Keep OpenAI in the map, but route to Pollinations
  openpipe: PollinationsAIServiceSetup,
  openrouter: PollinationsAIServiceSetup,
  perplexity: PollinationsAIServiceSetup,
  togetherai: PollinationsAIServiceSetup,
  xai: PollinationsAIServiceSetup, // Add the new Pollinations.ai vendor ID
  'pollinations.ai': PollinationsAIServiceSetup,
} as const;


export function LLMVendorSetup(props: { service: DModelsService }) {
  const vendor = findModelVendor(props.service.vId);
  if (!vendor)
    return 'Configuration issue: Vendor not found for Service ' + props.service.id;

  const SetupComponent = vendorSetupComponents[vendor.id];
  if (!SetupComponent)
    return 'Configuration issue: Setup component not found for vendor ' + vendor.id;

  return <SetupComponent key={props.service.id} serviceId={props.service.id} />;
}
