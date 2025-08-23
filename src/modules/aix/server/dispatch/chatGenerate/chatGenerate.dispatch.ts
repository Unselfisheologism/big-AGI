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
  request: { url: string, headers: HeadersInit, body: object },
  demuxerFormat: AixDemuxers.StreamDemuxerFormat;
  chatGenerateParse: ChatGenerateParseFunction;
} {

  switch (access.dialect) {
    /**
     * OpenAI and Compatible APIs
     */
    case 'alibaba':
    case 'azure':
    case 'deepseek':
    case 'groq':
    case 'lmstudio':
    case 'localai':
    case 'mistral':
    case 'openai':
    case 'openpipe':
    case 'openrouter':
    case 'perplexity':
    case 'pollinations.ai':
    case 'togetherai':
    case 'xai':

      // switch to the Responses API if the model supports it
      const isResponsesAPI = !!model.vndOaiResponsesAPI;
      if (isResponsesAPI) {
        return {
          request: {
            ...openAIAccess(access, model.id, '/v1/responses'),
            body: aixToOpenAIResponses(model, chatGenerate, false, streaming),
          },
          demuxerFormat: streaming ? 'fast-sse' : null,
          chatGenerateParse: streaming ? createOpenAIResponsesEventParser() : createOpenAIResponseParserNS(),
        };
      }

      return {
        request: {
          ...openAIAccess(access, model.id, '/v1/chat/completions'),
          body: aixToOpenAIChatCompletions(access.dialect, model, chatGenerate, false, streaming),
        },
        demuxerFormat: streaming ? 'fast-sse' : null,
        chatGenerateParse: streaming ? createOpenAIChatCompletionsChunkParser() : createOpenAIChatCompletionsParserNS(),
      };
  }

  // If we reach here, the dialect is not supported
 throw new TRPCError({
 code: 'BAD_REQUEST',
 message: `Unsupported dialect: ${access.dialect}`,
 });
}
