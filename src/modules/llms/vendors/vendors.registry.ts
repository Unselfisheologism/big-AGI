import { ModelVendorPollinationsAI } from './openai/openai.vendor';
 
import type { IModelVendor } from './IModelVendor';


export type ModelVendorId =
  | 'pollinations.ai'
  ;

/** Global: Vendor Instances Registry **/
const MODEL_VENDOR_REGISTRY: Record<ModelVendorId, IModelVendor> = {
 'pollinations.ai': ModelVendorPollinationsAI,
} as Record<string, IModelVendor>;


export function findAllModelVendors(): IModelVendor[] {
  const modelVendors = Object.values(MODEL_VENDOR_REGISTRY);
  modelVendors.sort((a, b) => a.displayRank - b.displayRank);
  return modelVendors;
}

export function findModelVendor<TServiceSettings extends object = {}, TAccess = unknown>(
  vendorId?: ModelVendorId,
): IModelVendor<TServiceSettings, TAccess> | null {
  return vendorId ? (MODEL_VENDOR_REGISTRY[vendorId] as IModelVendor<TServiceSettings, TAccess>) ?? null : null;
}

// export function getDefaultModelVendor(): IModelVendor {
//   return MODEL_VENDOR_REGISTRY.openai;
// }