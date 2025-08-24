import { create } from 'zustand';
import { persist } from 'zustand/middleware';


// NOTE: keep all the following type definitions in sync with the server-side
//       router types, in `openai.router.ts`, which in turn is a
//       strict subset of OpenAIWire_API_Images_Generations.Request

export type PollinationsAIModelId = 'flux' | 'kontext' | 'turbo';
export type PollinationsAIModelSelection = PollinationsAIModelId | null; // null = auto-select default

export type PollinationsAISize = string; // Can refine this if specific sizes are enforced
export type PollinationsAISeed = number | undefined;
export type PollinationsAINologo = boolean | undefined;
export type PollinationsAIEnhance = boolean | undefined;
export type PollinationsAIPrivate = boolean | undefined;
export type PollinationsAIReferrer = string | undefined;


interface T2ISettingsStore {

  pollinationsAIModelId: PollinationsAIModelSelection; // null = auto-select default
  setPollinationsAIModelId: (modelId: PollinationsAIModelSelection) => void;

  pollinationsAISize: PollinationsAISize;
  setPollinationsAISize: (size: PollinationsAISize) => void;

  pollinationsAISeed: PollinationsAISeed;
  setPollinationsAISeed: (seed: PollinationsAISeed) => void;

  pollinationsAINologo: PollinationsAINologo;
  setPollinationsAINologo: (nologo: PollinationsAINologo) => void;

  pollinationsAIEnhance: PollinationsAIEnhance;
  setPollinationsAIEnhance: (enhance: PollinationsAIEnhance) => void;

  pollinationsAIPrivate: PollinationsAIPrivate;
  setPollinationsAIPrivate: (isPrivate: PollinationsAIPrivate) => void;

  pollinationsAIReferrer: PollinationsAIReferrer;
  setPollinationsAIReferrer: (referrer: PollinationsAIReferrer) => void;

  pollinationsAIWidth?: number | undefined;
  setPollinationsAIWidth: (width: number | undefined) => void;
  pollinationsAIHeight?: number | undefined;
  setPollinationsAIHeight: (height: number | undefined) => void;
  // Note: pollinationsAINologo is already in the store



}

export const useT2ISettingsStore = create<T2ISettingsStore>()(
  persist(
    (set) => ({

      pollinationsAIModelId: 'flux', // auto-select default
      setPollinationsAIModelId: (pollinationsAIModelId) => set({ pollinationsAIModelId }),

      pollinationsAISize: '1024x1024',
      setPollinationsAISize: (pollinationsAISize) => set({ pollinationsAISize }),

      pollinationsAISeed: undefined,
      setPollinationsAISeed: (pollinationsAISeed) => set({ pollinationsAISeed }),

      pollinationsAINologo: undefined,
      setPollinationsAINologo: (pollinationsAINologo) => set({ pollinationsAINologo }),

      pollinationsAIEnhance: undefined,
      setPollinationsAIEnhance: (pollinationsAIEnhance) => set({ pollinationsAIEnhance }),

      pollinationsAIPrivate: undefined,
      setPollinationsAIPrivate: (pollinationsAIPrivate) => set({ pollinationsAIPrivate }),

      pollinationsAIReferrer: undefined,
      setPollinationsAIReferrer: (pollinationsAIReferrer) => set({ pollinationsAIReferrer }),

      pollinationsAIWidth: undefined, // Or a default number like 1024
      setPollinationsAIWidth: (pollinationsAIWidth) => set({ pollinationsAIWidth }),
      pollinationsAIHeight: undefined, // Or a default number like 1024
      setPollinationsAIHeight: (pollinationsAIHeight) => set({ pollinationsAIHeight }),


    }),
    {
      name: 'app-module-dalle',
      version: 1, // Reset version as the state shape is completely different

      migrate: (state: unknown, fromVersion) => {

        // 2: upgrade model to gpt-image-1
        if (state && fromVersion < 2)
          state = {
            ...(state as T2ISettingsStore),
            // No direct migration needed, reset to Pollinations.ai defaults
            pollinationsAIModelId: 'flux',
            pollinationsAISize: '1024x1024',
            pollinationsAISeed: undefined,
            pollinationsAINologo: undefined,
            pollinationsAIEnhance: undefined,
            pollinationsAIPrivate: undefined,
            pollinationsAIReferrer: undefined,
          } satisfies T2ISettingsStore;

        return state;
      },
    },
  ),
);