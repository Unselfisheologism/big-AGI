// src/modules/aix/server/dispatch/chatGenerate.dispatch.ts

import { openAIAccess } from '~/modules/llms/server/openai/openai.router';

import { TRPCError } from '@trpc/server';
import type { AixAPI_Access, AixAPI_Model, AixAPIChatGenerate_Request } from '../../api/aix.wiretypes';
import type { AixDemuxers } from '../stream.demuxers';

import { GeminiWire_API_Generate_Content } from '../wiretypes/gemini.wiretypes';

import { aixToAnthropicMessageCreate } from './adapters/anthropic.messageCreate';
import { aixToGeminiGenerateContent } from './adapters/gemini.generateContent';
import { aixToOpenAIChatCompletions } from './adapters/openai.chatCompletions';
import { aixToOpenAIResponses } from './adapters/openai.responsesCreate';

import type { IParticleTransmitter } from './IParticleTransmitter';
import { createAnthropicMessageParser, createAnthropicMessageParserNS } from './parsers/anthropic.parser';
import { createGeminiGenerateContentResponseParser } from './parsers/gemini.parser';
import { createOpenAIChatCompletionsChunkParser, createOpenAIChatCompletionsParserNS } from './parsers/openai.parser';
import { createOpenAIResponsesEventParser, createOpenAIResponseParserNS, } from './parsers/openai.responses.parser';


/**
 * Interface for the vendor parsers to implement
 */
export type ChatGenerateParseFunction = (partTransmitter: IParticleTransmitter, eventData: string, eventName?: string) => void;


/**
 * Specializes to the correct vendor a request for chat generation
 */
export function createChatGenerateDispatch(access: AixAPI_Access, model: AixAPI_Model, chatGenerate: AixAPIChatGenerate_Request, streaming: boolean): {
  request: { url: string, headers: HeadersInit, body: object | undefined, method?: string }, // Add method to request type
  demuxerFormat: AixDemuxers.StreamDemuxerFormat;
  chatGenerateParse: ChatGenerateParseFunction;
} {

  switch (access.dialect) {
    /**
     * OpenAI and Compatible APIs
     */
    case 'openai':
      // For OpenAI, retain the existing POST logic
      const isResponsesAPI = !!model.vndOaiResponsesAPI;
      if (isResponsesAPI) {
        return {
          request: {
            ...openAIAccess(access, model.id, '/responses'),
            body: aixToOpenAIResponses(model, chatGenerate, false, streaming),
            method: 'POST', // Explicitly set method for clarity
          },
          demuxerFormat: streaming ? 'fast-sse' : null,
          chatGenerateParse: streaming ? createOpenAIResponsesEventParser() : createOpenAIResponseParserNS(),
        };
      }

      return {
        request: {
          ...openAIAccess(access, model.id, '/chat/completions'),
          body: aixToOpenAIChatCompletions(access.dialect, model, chatGenerate, false, streaming),
          method: 'POST', // Explicitly set method for clarity
        },
        demuxerFormat: streaming ? 'fast-sse' : null,
        chatGenerateParse: streaming ? createOpenAIChatCompletionsChunkParser() : createOpenAIChatCompletionsParserNS(),
      };

    case 'pollinations.ai':
        // For Pollinations.ai, use the GET method with parameters in the URL
        // Call openAIAccess with '/chat/completions' which will be mapped to the base GET URL for Pollinations.ai
        return {
            request: {
                ...openAIAccess(access, model.id, '/chat/completions'),
                body: undefined, // No body for GET requests
                method: 'GET', // Explicitly set method to GET
            },
            // Pollinations.ai GET endpoint does not support streaming via SSE for simple text generation
            demuxerFormat: null, // No streaming format for this GET endpoint
            chatGenerateParse: createOpenAIChatCompletionsParserNS(), // Use a non-streaming parser
        };

    default: // Handle other dialects
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Unsupported dialect: ${access.dialect}`,
      });
  }
}
