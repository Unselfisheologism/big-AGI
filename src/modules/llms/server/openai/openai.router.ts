import * as z from 'zod/v4';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, publicProcedure } from '~/server/trpc/trpc.server';
import { env } from '~/server/env';
import { fetchJsonOrTRPCThrow } from '~/server/trpc/trpc.router.fetchers';
import { serverCapitalizeFirstLetter } from '~/server/wire';

import type { T2ICreateImageAsyncStreamOp } from '~/modules/t2i/t2i.server';
import { heartbeatsWhileAwaiting } from '~/modules/aix/server/dispatch/heartbeatsWhileAwaiting';

import { Brand } from '~/common/app.config';

import { OpenAIWire_API_Images_Generations, OpenAIWire_API_Models_List, OpenAIWire_API_Moderations_Create } from '~/modules/aix/server/dispatch/wiretypes/openai.wiretypes';

import { ListModelsResponse_schema, ModelDescriptionSchema } from '../llm.server.types';
import { pollinationsModels } from './models/pollinations.models';
import { lmStudioModelToModelDescription, localAIModelSortFn, localAIModelToModelDescription } from './models/models.data';
import { openAIModelFilter, openAIModelToModelDescription, openAISortModels } from './models/openai.models';
import { wireLocalAIModelsApplyOutputSchema, wireLocalAIModelsAvailableOutputSchema, wireLocalAIModelsListOutputSchema } from './localai.wiretypes';


const openAIDialects = z.enum([ // Note: this enum still contains old dialects, but only 'localai' will be handled specifically in openAIAccess
  'alibaba', 'azure', 'deepseek', 'groq', 'lmstudio', 'localai', 'mistral', 'openai', 'openpipe', 'openrouter', 'perplexity', 'togetherai', 'xai', 'pollinations.ai',
]);
export type OpenAIDialects = z.infer<typeof openAIDialects>;

export const openAIAccessSchema = z.object({
  dialect: openAIDialects,
  oaiKey: z.string().trim(),
  oaiOrg: z.string().trim(), // Kept for potential future use or compatibility, but not used for Pollinations.AI
  oaiHost: z.string().trim(),
  heliKey: z.string().trim(),
  moderationCheck: z.boolean(),
  pollinationsAIApiKey: z.string().trim().optional(),
  pollinationsAIApiHost: z.string().trim().optional(),

});
export type OpenAIAccessSchema = z.infer<typeof openAIAccessSchema>;

// export const openAIModelSchema = z.object({
//   id: z.string(),
//   temperature: z.number().min(0).max(2).optional(),
//   maxTokens: z.number().min(1).optional(),
// });
// export type OpenAIModelSchema = z.infer<typeof openAIModelSchema>;

// export const openAIHistorySchema = z.array(z.object({
//   role: z.enum(['assistant', 'system', 'user'/*, 'function'*/]),
//   content: z.string(),
// }));
// export type OpenAIHistorySchema = z.infer<typeof openAIHistorySchema>;


// Fixup host function

/** Add https if missing, and remove trailing slash if present and the path starts with a slash. */
export function fixupHost(host: string, apiPath: string): string {
  if (!host.startsWith('http'))
    host = `https://${host}`;
  if (host.endsWith('/') && apiPath.startsWith('/'))
    host = host.slice(0, -1);
  return host;
}


// Router Input Schemas

const listModelsInputSchema = z.object({
  access: openAIAccessSchema,
});


const _createImageConfigBase = z.object({
  // prompt: z.string().max(32000),
  count: z.number().min(1).max(10),
  user: z.string().optional(),
});

// GPT Image
const createImageConfigGI = _createImageConfigBase.extend({
  model: z.literal('gpt-image-1'),
  prompt: z.string().max(32000),
  size: z.enum([/*'auto',*/ '1024x1024', '1536x1024', '1024x1536']),
  quality: z.enum(['high', 'medium', 'low']).optional(),
  background: z.enum(['auto', 'transparent', 'opaque']).optional(),
  output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
  output_compression: z.number().min(0).max(100).int().optional(),
  moderation: z.enum(['low', 'auto']).optional(),
});

// DALL-E 3
const createImageConfigD3 = _createImageConfigBase.extend({
  model: z.literal('dall-e-3'),
  count: z.number().min(1).max(1), // DALL-E 3 only supports n=1
  prompt: z.string().max(4000),
  quality: z.enum(['standard', 'hd']),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']),
  style: z.enum(['vivid', 'natural']).optional(),
  response_format: z.enum([/*'url',*/ 'b64_json']).optional(),
});

// DALL-E 2
const createImageConfigD2 = _createImageConfigBase.extend({
  model: z.literal('dall-e-2'),
  prompt: z.string().max(1000),
  quality: z.literal('standard').optional(),
  size: z.enum(['256x256', '512x512', '1024x1024']),
  response_format: z.enum([/*'url',*/ 'b64_json']).optional(),
});

const createImagesInputSchema = z.object({
  access: openAIAccessSchema,
  // for this object sync with <> OpenAIWire_API_Images_Generations.Request_schema
  generationConfig: z.discriminatedUnion('model', [
    createImageConfigGI,
    createImageConfigD3,
    createImageConfigD2,
  ]),
  editConfig: z.object({
    /**
     * This is the exact copy of AixWire_Parts.InlineImagePart_schema, but somehow we must keep
     * this module separate for now, or we'll get circular dependencies during the build.
     */
    inputImages: z.array(z.object({
      pt: z.literal('inline_image'),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      base64: z.string(),
    })),
    maskImage: z.object({
      pt: z.literal('inline_image'),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      base64: z.string(),
    }).optional(),
  }).optional(),
});


const moderationInputSchema = z.object({
  access: openAIAccessSchema,
  text: z.string(),
});


export const llmOpenAIRouter = createTRPCRouter({

  /* [OpenAI] List the Models available */
  listModels: publicProcedure
    .input(listModelsInputSchema)
    .output(ListModelsResponse_schema)
    .query(async ({ input: { access } }): Promise<{ models: ModelDescriptionSchema[] }> => {

      // Handle LocalAI separately
      if (access.dialect === 'pollinations.ai') {
        const openAIWireModelsResponse = await openaiGETOrThrow<OpenAIWire_API_Models_List.Response>(access, '/v1/models');
        let openAIModels = openAIWireModelsResponse.data || [];
        return {
          models: openAIModels
            .map(({ id }) => localAIModelToModelDescription(id))
            .sort(localAIModelSortFn),
        };
      }

      // For Pollinations.AI, use the hardcoded list (for now)
      return { models: pollinationsModels() };
    }),


  /* [OpenAI/LocalAI] images/generations */
  createImages: publicProcedure
    .input(createImagesInputSchema)
    .mutation(async function* ({ input, signal }): AsyncGenerator<T2ICreateImageAsyncStreamOp> {

      const { access, generationConfig: config, editConfig } = input;

      // Determine if this is an edit request
      const isEdit = !!editConfig?.inputImages?.length && config.model === 'gpt-image-1';

      // validate input
      if (isEdit && config.model !== 'gpt-image-1')
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Image editing is only supported for GPT Image models` });
      if (config.model === 'dall-e-3' && config.count > 1)
        throw new TRPCError({ code: 'BAD_REQUEST', message: `[OpenAI Issue] dall-e-3 model does not support more than 1 image` });
      // if (config.model !== 'gpt-image-1' && (config.background || config.moderation || config.output_compression || config.output_format))
      //   throw new TRPCError({ code: 'BAD_REQUEST', message: `[OpenAI Issue] background, moderation, output_compression, output_format are only supported for gpt-image-1` });
      // if (config.model !== 'dall-e-3' && config.style)
      //   throw new TRPCError({ code: 'BAD_REQUEST', message: `[OpenAI Issue] style is only supported for dall-e-3` });


      // Prepare request body (JSON for generation, FormData for edit)
      let requestBody: OpenAIWire_API_Images_Generations.Request | FormData;
      let genImageMimeType = 'image/png'; // assume as default

      if (!isEdit) {

        const { count, ...restConfig } = config;
        requestBody = {
          ...restConfig, // includes response_format for dall-e-3 and dall-e-2 models
          n: count,
          user: config.user || 'Big-AGI',
        };

        // [LocalAI] Fix: LocalAI does not want the 'response_format' field
        if (access.dialect === 'pollinations.ai' && 'response_format' in requestBody)
          delete requestBody['response_format'];

        // auto-selects the output image mime type - or defaults to the first one
        if (requestBody.output_format === 'jpeg')
          genImageMimeType = 'image/jpeg';
        else if (requestBody.output_format === 'webp')
          genImageMimeType = 'image/webp';

      } else {
        requestBody = new FormData();

        // append required & optional fields
        const { prompt, model, count, quality, size, user } = config;
        requestBody.append('prompt', prompt);
        requestBody.append('model', model);
        if (count > 1) requestBody.append('n', '' + count);
        if (quality && (quality as string) !== 'auto') requestBody.append('quality', quality);
        if (size && (size as string) !== 'auto') requestBody.append('size', size);
        // if (model === 'dall-e-2') requestBody.append('response_format', 'b64_json');
        requestBody.append('user', user || 'Big-AGI');

        // append input images
        const imagesCount = editConfig.inputImages.length;
        for (let i = 0; i < imagesCount; i++) {
          const { base64, mimeType } = editConfig.inputImages[i];
          requestBody.append(
            imagesCount === 1 ? 'image' : 'image[]',
            server_base64ToBlob(base64, mimeType),
            `image_${i}.${mimeType.split('/')[1] || 'png'}`, // important to be a unique filename
          );
        }

        // append mask image if provided
        if (editConfig.maskImage)
          requestBody.append(
            'mask',
            server_base64ToBlob(editConfig.maskImage.base64, editConfig.maskImage.mimeType),
            `mask.${editConfig.maskImage.mimeType.split('/')[1] || 'png'}`,
          );
      }

      // -> state.started
      yield { p: 'state', state: 'started' };

      // -> heartbeats, while waiting for the generation response
      const wireOpenAICreateImageOutput = yield* heartbeatsWhileAwaiting(
        openaiPOSTOrThrow<OpenAIWire_API_Images_Generations.Response, OpenAIWire_API_Images_Generations.Request | FormData>(
          access,
          config.model,  // modelRefId not really needed for these endpoints
          requestBody,
          isEdit ? '/v1/images/edits' : '/v1/images/generations',
          signal, // wire the signal from the input
        )
        .catch((error: any) => {
          // if aborted, ignore the error, or else we'll throw an error
          if (signal?.aborted)
            return null; // de-facto ignores the error, and the connection is already gone

          // otherwise, re-throw the error
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error: ${error?.message || error?.toString() || 'Unknown error'}`,
            cause: error,
          });
        }),
      );

      // null: there was an error
      if (!wireOpenAICreateImageOutput)
        return null;

      // common image fields
      const [width, height] = (config.size as any) === 'auto'
        ? [1024, 1024] // NOTE: this is broken, bad assumption, but so that we don't throw an error
        : config.size.split('x').map(nStr => parseInt(nStr));
      if (!width || !height) {
        console.error(`openai.router.createImages: invalid size ${config.size}`);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `[OpenAI Issue] Invalid size ${config.size}` });
      }
      const { count: _ignoreCount, prompt: origPrompt, ...parameters } = config;

      // parse the response and emit all images in the response
      const { data: images, usage: tokens } = OpenAIWire_API_Images_Generations.Response_schema.parse(wireOpenAICreateImageOutput);
      for (const image of images) {
        if (!('b64_json' in image))
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `[OpenAI Issue] Expected a b64_json, got a url` });

        // -> createImage
        yield {
          p: 'createImage',
          image: {
            mimeType: genImageMimeType,
            base64Data: image.b64_json!,
            altText: image.revised_prompt || origPrompt,
            width,
            height,
            ...(tokens?.input_tokens !== undefined ? { inputTokens: tokens.input_tokens } : {}),
            ...(tokens?.output_tokens !== undefined ? { outputTokens: tokens.output_tokens } : {}),
            generatorName: config.model,
            parameters: parameters,
            generatedAt: new Date().toISOString(),
          },
        };
      }
    }),


  /* [OpenAI] check for content policy violations */
  moderation: publicProcedure
    .input(moderationInputSchema)
    .mutation(async ({ input: { access, text } }): Promise<OpenAIWire_API_Moderations_Create.Response> => {
      try {

        return await openaiPOSTOrThrow<OpenAIWire_API_Moderations_Create.Response, OpenAIWire_API_Moderations_Create.Request>(access, null, {
          input: text,
          model: 'text-moderation-latest',
        }, '/v1/moderations');

      } catch (error: any) {
        if (error.code === 'ECONNRESET')
          throw new TRPCError({ code: 'CLIENT_CLOSED_REQUEST', message: 'Connection reset by the client.' });

        console.error('api/openai/moderation error:', error);
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Error: ${error?.message || error?.toString() || 'Unknown error'}` });
      }
    }),


  /// Dialect-specific procedures ///

  /* [LocalAI] List all Model Galleries */
  dialectLocalAI_galleryModelsAvailable: publicProcedure
    .input(listModelsInputSchema)
    .query(async ({ input: { access } }) => {
      const wireLocalAIModelsAvailable = await openaiGETOrThrow(access, '/models/available');
      return wireLocalAIModelsAvailableOutputSchema.parse(wireLocalAIModelsAvailable);
    }),

  /* [LocalAI] Download a model from a Model Gallery */
  dialectLocalAI_galleryModelsApply: publicProcedure
    .input(z.object({
      access: openAIAccessSchema,
      galleryName: z.string(),
      modelName: z.string(),
    }))
    .mutation(async ({ input: { access, galleryName, modelName } }) => {
      const galleryModelId = `${galleryName}@${modelName}`;
      const wireLocalAIModelApply = await openaiPOSTOrThrow(access, null, { id: galleryModelId }, '/models/apply');
      return wireLocalAIModelsApplyOutputSchema.parse(wireLocalAIModelApply);
    }),

  /* [LocalAI] Poll for a Model download Job status */
  dialectLocalAI_galleryModelsJob: publicProcedure
    .input(z.object({
      access: openAIAccessSchema,
      jobId: z.string(),
    }))
    .query(async ({ input: { access, jobId } }) => {
      const wireLocalAIModelsJobs = await openaiGETOrThrow(access, `/models/jobs/${jobId}`);
      return wireLocalAIModelsListOutputSchema.parse(wireLocalAIModelsJobs);
    }),

});


const DEFAULT_POLLINATIONS_API_HOST = 'https://text.pollinations.ai'; // Default for text/multimodal


/**
 * Get a random key from a comma-separated list of API keys
 * @param multiKeyString Comma-separated string of API keys
 * @returns A randomly selected single API key
 */
function getRandomKeyFromMultiKey(multiKeyString: string): string {
  if (!multiKeyString.includes(','))
    return multiKeyString;

  const multiKeys = multiKeyString
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);

  if (!multiKeys.length)
    return '';

  return multiKeys[Math.floor(Math.random() * multiKeys.length)];
}

const DEFAULT_LOCALAI_HOST = 'http://127.0.0.1:8080';

export function openAIAccess(access: OpenAIAccessSchema, modelRefId: string | null, apiPath: string): { headers: HeadersInit, url: string } {
  // Handle LocalAI separately
  if (access.dialect === 'pollinations.ai') {
    const localAIKey = access.oaiKey || env.LOCALAI_API_KEY || '';
    const localAIHost = fixupHost(access.oaiHost || env.LOCALAI_API_HOST || DEFAULT_LOCALAI_HOST, apiPath);
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(localAIKey && { Authorization: `Bearer ${localAIKey}` }),
      },
      url: localAIHost + apiPath,
    };
  }

  // For all other dialects, use Pollinations.AI
  const pollKey = access.oaiKey || env.POLLINATIONS_API_KEY || '';
  let pollHost: string;
  let url: string;

  if (apiPath === '/chat/completions') {
    pollHost = access.oaiHost || env.POLLINATIONS_API_HOST || DEFAULT_POLLINATIONS_API_HOST;
    url = `${fixupHost(pollHost, '/openai')}/openai`; // Use the OpenAI-compatible endpoint path
  } else if (apiPath.startsWith('/images/generations')) {
      // Pollinations.ai image generation uses a GET request to a different endpoint structure
      // The construction of the full image URL should happen in the createImages mutation
      pollHost = access.oaiHost?.replace('/openai', '') || env.POLLINATIONS_API_HOST?.replace('/openai', '') || 'https://image.pollinations.ai'; // Use the image host
      url = `${fixupHost(pollHost, '')}${apiPath}`; // Keep the apiPath as is for now, will be fully constructed in createImages
      console.warn(`openAIAccess: Image generation URL will be fully constructed in createImages mutation.`);
    }
  else if (apiPath === '/models') {
    // Pollinations.ai model listing endpoint
    pollHost = access.oaiHost || env.POLLINATIONS_API_HOST || DEFAULT_POLLINATIONS_API_HOST;
    url = `${fixupHost(pollHost, '/models')}/models`;
  }
  else {
    // Handle other potential API paths if Pollinations.ai supports them
    pollHost = access.oaiHost || env.POLLINATIONS_API_HOST || DEFAULT_POLLINATIONS_API_HOST;
    url = `${fixupHost(pollHost, apiPath)}${apiPath}`;
    console.warn(`openAIAccess: Using generic path for Pollinations.ai: ${apiPath}`);
  }

  // Add Referrer header
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Referrer': Brand.URIs.Home,
    ...(pollKey && { Authorization: `Bearer ${pollKey}` }),
  };

  // [Cloudflare AI Gateway support] - Log a warning if Cloudflare host is used with Pollinations
  if (pollHost.includes('https://gateway.ai.cloudflare.com')) {
    console.warn(`Cloudflare AI Gateway host "${pollHost}" provided with Pollinations.AI access. Ensure it is configured to proxy correctly.`);
  }

  return {
    headers,
    url: url,
  };
}


async function openaiGETOrThrow<TOut extends object>(access: OpenAIAccessSchema, apiPath: string /*, signal?: AbortSignal*/): Promise<TOut> {
  const { headers, url } = openAIAccess(access, null, apiPath);
  return await fetchJsonOrTRPCThrow<TOut>({ url, headers, name: `OpenAI/${serverCapitalizeFirstLetter(access.dialect)}` });
}

async function openaiPOSTOrThrow<TOut extends object, TPostBody extends object | FormData>(access: OpenAIAccessSchema, modelRefId: string | null, body: TPostBody, apiPath: string, signal: undefined | AbortSignal = undefined): Promise<TOut> {
  const { headers, url } = openAIAccess(access, modelRefId, apiPath);
  return await fetchJsonOrTRPCThrow<TOut, TPostBody>({ url, method: 'POST', headers, body, name: `OpenAI/${serverCapitalizeFirstLetter(access.dialect)}`, signal });
}


/** @serverSide Buffer is a Node.js API, not a Browser API. */
function server_base64ToBlob(base64Data: string, mimeType: string) {
  const buffer = Buffer.from(base64Data, 'base64');
  return new Blob([buffer], { type: mimeType });
}
