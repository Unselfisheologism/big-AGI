import { AudioPlayer } from '~/common/util/audio/AudioPlayer';

/**
 * Fetches audio from Pollinations.AI and plays it.
 *
 * @param text The text to speak.
 * @param voice The voice to use.
 */
export async function pollinationsSpeakText(text: string, voice: string) {
  if (!text.trim() || !voice) return;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai-audio&voice=${voice}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai-audio',
        input: text,
        voice: voice,
      }),
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      await AudioPlayer.playUrl(audioUrl);
      URL.revokeObjectURL(audioUrl); // Clean up the object URL after playing
    } else {
      // Log the error response from the API
      const errorData = await response.text();
      console.error('Pollinations.AI API error:', response.status, errorData);
    }
  } catch (error) {
    console.error('Error fetching or playing audio from Pollinations.AI:', error);
  }
}

/**
 * Hook to check for Pollinations.AI TTS capability.
 */
export function useCapability(): { mayWork: boolean } {
  return { mayWork: true };
}
