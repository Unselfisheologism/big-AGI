import * as React from 'react';

import { Alert, FormControl, FormLabel, Stack } from '@mui/joy';

import { FormChipControl } from '../../common/components/forms/FormChipControl'; // Corrected import path
import { FormTextField } from '../../common/components/forms/FormTextField'; // Assuming FormTextField is the correct component and path
import { type FormRadioOption } from '../../common/components/forms/FormRadioControl'; // Corrected import path and imported type
import { useT2ISettingsStore } from 'src/modules/t2i/dalle/store-module-t2i-settings'; // Import renamed store
import { useCapabilityTextToImage, type CapabilityTextToImage } from '../../common/components/useCapabilities';

export function T2ISettings() {

  // external state
  const {
    mayWork,
    providers,
    activeProviderId,
    setActiveProviderId, // Setter for active provider
    // Pollinations.ai T2I settings and setters from useCapabilityTextToImage
    pollinationsAIModelId, setPollinationsAIModelId,
    pollinationsAIWidth, setPollinationsAIWidth,
    pollinationsAIHeight, setPollinationsAIHeight,
    pollinationsAISeed, setPollinationsAISeed,
    pollinationsAINologo, setPollinationsAINologo,
  } = useCapabilityTextToImage();
  // Removed useT2ISettingsStore import as settings are now provided by useCapabilityTextToImage


  // derived state
  const providerOptions = React.useMemo(() => {
    const options: FormRadioOption<string>[] = []; // Use the correctly defined type
    providers.forEach(provider => {
      options.push({
        label: provider.label,
        title: provider.label, // Added title property
        value: provider.providerId,
        disabled: !provider.configured,
      });
    });
    return options.toReversed();
  }, [providers]);


  return <>

    {!mayWork ? (

      <Alert variant='soft'>
        There are no configured services for text-to-image generation.
        Please configure one service, such as an OpenAI LLM service, below.
      </Alert>

    ) : (

      <FormChipControl
        title='Text-to-Image'
        description='Active Service'
        // tooltip='Select the service to use for text-to-image generation.'
        disabled={!mayWork}
        options={providerOptions}
        value={activeProviderId as string | undefined} onChange={setActiveProviderId}
      />

    )} {/* End of !mayWork conditional rendering */}

    {/* Pollinations.ai Specific Settings - Show only if Pollinations.ai is the active provider */}
    {activeProviderId === 'pollinations.ai' && (
      <Stack spacing={2} sx={{ mt: 2 }}>
        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
          <FormLabel>Model</FormLabel>
          <FormChipControl
            options={[
              { label: 'Flux', value: 'flux' },
              { label: 'Kontext', value: 'kontext' },
              { label: 'Turbo', value: 'turbo' },
            ]}
            value={pollinationsAIModelId}
            onChange={(value) => setPollinationsAIModelId(value as 'flux' | 'kontext' | 'turbo')}
            title={''} // Assuming title prop is required and can be an empty string for this component
          />
        </FormControl>

        <FormTextField
          autoCompleteId="t2i-width"
          title="Width"
          description="Image width in pixels"
          placeholder="e.g., 1024"
          value={pollinationsAIWidth?.toString() || ''} // Convert number or undefined to string
          onChange={(text: string) => setPollinationsAIWidth(parseInt(text) || undefined)} // Convert string to number or undefined
        />

        <FormTextField
          autoCompleteId="t2i-height"
          title="Height"
          description="Image height in pixels"
          placeholder="e.g., 1024"
          value={pollinationsAIHeight?.toString() || ''}
          onChange={(text: string) => setPollinationsAIHeight(parseInt(text) || undefined)} // Convert string to number or undefined
        />

        <FormTextField
          autoCompleteId="t2i-seed"
          title="Seed"
          description="Seed for reproducible results (optional)"
          placeholder="e.g., 1234"
          value={pollinationsAISeed?.toString() || ''}
          onChange={(text: string) => setPollinationsAISeed(parseInt(text) || undefined)} // Convert string to number or undefined
        />
         {/* Pollinations.ai doesn't have a 'nologo' parameter on the GET endpoint based on documentation.
             Leaving this out for now. If needed, this would be where you add it based on your store.
         <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
           <FormLabel>No Logo</FormLabel>
           <Checkbox checked={pollinationsAINologo} onChange={(e) => setPollinationsAINologo(e.target.checked)} />
         </FormControl>
         */}
      </Stack>
    )}
  </>;
}
