import * as React from 'react';

import { Alert } from '@mui/joy';

import type { DModelsServiceId } from '~/common/stores/llms/llms.service.types';
import { AlreadySet } from '~/common/components/AlreadySet';
import { Brand } from '~/common/app.config';
import { FormInputKey } from '~/common/components/forms/FormInputKey';
import { FormTextField } from '~/common/components/forms/FormTextField';
import { InlineError } from '~/common/components/InlineError';
import { Link } from '~/common/components/Link';
import { SetupFormRefetchButton } from '~/common/components/forms/SetupFormRefetchButton';
import { useToggleableBoolean } from '~/common/util/hooks/useToggleableBoolean';

import { ApproximateCosts } from '../ApproximateCosts';
import { useLlmUpdateModels } from '../../llm.client.hooks';
import type { OpenAIAccessSchema } from '../../server/openai/openai.router'; // Keep this import for now if OpenAIAccessSchema is needed
import { useServiceSetup } from '../useServiceSetup';

// Update the import path to be relative to the new location
import { ModelVendorPollinationsAI, type DPollinationsAIAccess } from './pollinationsai.vendor';


// NOTE: This file was moved from the openai folder and renamed from OpenAIServiceSetup.tsx

export function PollinationsAIServiceSetup(props: { serviceId: DModelsServiceId }) {
  // state
  const advanced = useToggleableBoolean(!!props.serviceId?.includes('-'));

  // external state
  const { service, serviceAccess, serviceHasCloudTenantConfig, serviceHasLLMs, updateSettings } =
 useServiceSetup<DPollinationsAIAccess, OpenAIAccessSchema>(props.serviceId, ModelVendorPollinationsAI);

  // Check if the current configuration is likely for Pollinations.ai based on the host
  // const isPollinationsAI = serviceAccess.pollinationsAIApiHost?.includes('pollinations.ai'); // Not needed with dedicated vendor

  // derived state
  const { pollinationsAIApiKey, pollinationsAIApiHost } = serviceAccess;
  const needsUserKey = !serviceHasCloudTenantConfig; // Assuming Pollinations.ai can have cloud-set keys too

  const keyValid = true; // No specific key validation needed for Pollinations.ai
  const keyError = (/*needsUserKey ||*/ !!pollinationsAIApiKey) && !keyValid;
  const shallFetchSucceed = pollinationsAIApiKey ? keyValid : !needsUserKey; // Fetch succeeds if user key is provided or no user key is needed

  // fetch models
  const { isFetching, refetch, isError, error } = useLlmUpdateModels(!serviceHasLLMs && shallFetchSucceed, service);


  return <>

    <ApproximateCosts serviceId={service?.id} />

    <FormInputKey
      autoCompleteId='pollinationsai-api-key'
      label='API Token (Optional)'
      rightLabel={<>{pollinationsAIApiKey && <Link level='body-sm' href='https://pollinations.ai/APIDOCS.md#authentication--tiers-🔑' target='_blank'>check tiers & usage</Link>}
        {!pollinationsAIApiKey && needsUserKey && <Link level='body-sm' href='https://auth.pollinations.ai' target='_blank'>get token/register referrer</Link>}
        {!pollinationsAIApiKey && !needsUserKey && <AlreadySet />}
      </>}
      value={pollinationsAIApiKey || ''} // Use empty string for controlled component
      onChange={value => updateSettings({ pollinationsAIApiKey: value })}
      required={false} // API key is optional for basic use in Pollinations.AI
      isError={keyError}
      placeholder='Enter Pollinations.AI API Token (optional)'
    />

    {advanced.on && <FormTextField
      autoCompleteId='pollinationsai-api-host'
      title='API Endpoint'
      placeholder='Optional, defaults to https://text.pollinations.ai'
      value={pollinationsAIApiHost || ''}
      onChange={text => updateSettings({ pollinationsAIApiHost: text })}
    />}

  </>;
}