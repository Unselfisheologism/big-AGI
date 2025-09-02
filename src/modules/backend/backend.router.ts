import * as z from 'zod/v4';

import { Release } from '~/common/app.release';

import { createTRPCRouter, publicProcedure } from '~/server/trpc/trpc.server';
import { env } from '~/server/env';
import { fetchJsonOrTRPCThrow } from '~/server/trpc/trpc.router.fetchers';

// critical to make sure we `import type` here
import type { BackendCapabilities } from './store-backend-capabilities';


function sdbmHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = char + (hash << 6) + (hash << 16) - hash;
  }
  // Convert to unsigned 32-bit integer and then to hex string
  return (hash >>> 0).toString(16);
}

function generateLlmEnvConfigHash(env: Record<string, unknown>): string {
  const envAPIKeys = Object.keys(env)     // get all env keys
    .filter(key => !!env[key])            // minus the empty
    .filter(key => key.includes('_API_')) // minus the non-API keys
    .map(key => `${key}=${env[key]}`)     // create key-value pairs
    .sort();                              // ignore order
  const hashInputs = [
    Release.Monotonics.Aix.toString(),  // triggers at every change (large downstream effect, know what you are doing)
    Release.TenantSlug.toString(),          // triggers when branch changes
    ...envAPIKeys,                      // triggers when env keys change
  ];
  return sdbmHash(hashInputs.join(';'));
}


/**
 * This is the primary router for the backend. Mainly, this deals with letting
 * the frontend know what capabilities are available, by virtue of being
 * pre-configured in the servr. In the future this will evolve to a better
 * server-side configuration system.
 */
export const backendRouter = createTRPCRouter({

  /* List server-side capabilities (pre-configured by the deployer) */
  listCapabilities: publicProcedure
    .query(async ({ ctx: _unused }): Promise<BackendCapabilities> => {
      return {
        // llms
        hasLlmLocalAIHost: !!env.LOCALAI_API_HOST,
        hasLlmLocalAIKey: !!env.LOCALAI_API_KEY,
        hasLlmPollinations: !!env.POLLINATIONS_API_KEY || !!env.POLLINATIONS_API_HOST,
        // Explicitly set other providers to false as they are not directly used
        hasLlmAlibaba: false,
        hasLlmAnthropic: false,
        hasLlmAzureOpenAI: false,
        hasLlmDeepseek: false,
        hasLlmGemini: false,
        hasLlmGroq: false,
        hasLlmMistral: false,
        hasLlmOllama: false,
        hasLlmOpenAI: false, // This was likely the original OpenAI provider
        hasLlmOpenPipe: false,
        hasLlmOpenRouter: false,
        hasLlmPerplexity: false,
        hasLlmTogetherAI: false,
        hasLlmXAI: false,
        // others
        hasDB: (!!env.MDB_URI) || (!!env.POSTGRES_PRISMA_URL && !!env.POSTGRES_URL_NON_POOLING),
        hasBrowsing: !!env.PUPPETEER_WSS_ENDPOINT,
        hasGoogleCustomSearch: !!env.GOOGLE_CSE_ID && !!env.GOOGLE_CLOUD_API_KEY,
        // hashes
        hashLlmReconfig: generateLlmEnvConfigHash(env),
        // build data
        build: Release.buildInfo('backend'),
      };
    }),


  // The following are used for various OAuth integrations

  /**
   * Exchange the OpenrRouter 'code' (from PKCS) for an OpenRouter API Key
   */
  exchangeOpenRouterKey: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      // Documented here: https://openrouter.ai/docs#oauth
      return await fetchJsonOrTRPCThrow<{ key: string }, { code: string }>({
        url: 'https://openrouter.ai/api/v1/auth/keys',
        method: 'POST',
        body: { code: input.code },
        name: 'Backend.exchangeOpenRouterKey',
      });
    }),

});
