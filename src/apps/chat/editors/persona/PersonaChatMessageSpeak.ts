import { pollinationsSpeakText } from '~/modules/pollinations/pollinations.client';
import { usePollinationsVoiceDropdown } from '~/modules/pollinations/usePollinationsVoiceDropdown';
import { isTextContentFragment } from '~/common/stores/chat/chat.fragments';

import type { AixChatGenerateContent_DMessage } from '~/modules/aix/client/aix.client';

import type { PersonaProcessorInterface } from '../chat-persona';

export type AutoSpeakType = 'off' | 'firstLine' | 'all';

export class PersonaChatMessageSpeak implements PersonaProcessorInterface {
  private spokenLine: boolean = false;
  
  // Constructor now accepts voiceId as a parameter instead of using the hook
  constructor(
    private autoSpeakType: AutoSpeakType,
    private voiceId: string | null
  ) {}

  handleMessage(accumulatedMessage: Partial<AixChatGenerateContent_DMessage>, messageComplete: boolean) {
    if (this.autoSpeakType === 'off' || this.spokenLine) return;

    if (!accumulatedMessage.fragments?.length || !isTextContentFragment(accumulatedMessage.fragments[0]))
      return;
    const text = accumulatedMessage.fragments[0].part.text;

    if (!messageComplete)
      this.#handleTextSoFar(text);
    else
      this.#finalizeText(text);
  }

  #handleTextSoFar(textSoFar: string): void {
    if (this.autoSpeakType === 'firstLine') {
      const cutPoint = this.#findLastCutPoint(textSoFar);
      if (cutPoint > 100 && cutPoint < 400) {
        const firstParagraph = textSoFar.substring(0, cutPoint);
        this.#speak(firstParagraph);
      }
    }
  }

  #finalizeText(fullText: string): void {
    if (fullText.length > 0) {
      this.#speak(fullText);
    }
  }

  #findLastCutPoint(text: string): number {
    let cutPoint = text.lastIndexOf('\n');
    if (cutPoint < 0)
      cutPoint = text.lastIndexOf('. ');
    return cutPoint;
  }

  #speak(text: string) {
    if (this.voiceId) {
      console.log('📢 TTS:', text);
      this.spokenLine = true;
      void pollinationsSpeakText(text, this.voiceId);
    }
  }
}
