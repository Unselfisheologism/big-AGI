import * as React from 'react';
import { Option, Select } from '@mui/joy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RecordVoiceOverTwoToneIcon from '@mui/icons-material/RecordVoiceOverTwoTone';

import { pollinationsSpeakText } from './pollinations.client';

const POLLINATIONS_VOICES = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

function VoicesDropdown(props: {
  disabled?: boolean,
  voices: { id: string, name: string }[],
  voiceId: string | null,
  setVoiceId: (voiceId: string) => void,
}) {

  const handleVoiceChange = (_event: any, value: string | null) => {
    props.setVoiceId(value || '');
    if (value) {
      pollinationsSpeakText(`Hello! I am ${value}, your new voice assistant.`, value);
    }
  };

  return (
    <Select
      value={props.voiceId}
      onChange={handleVoiceChange}
      variant='outlined'
      disabled={props.disabled}
      placeholder='Select a voice'
      startDecorator={<RecordVoiceOverTwoToneIcon />}
      indicator={<KeyboardArrowDownIcon />}
      slotProps={{
        root: { sx: { width: '100%' } },
        indicator: { sx: { opacity: 0.5 } },
      }}
    >
      {props.voices.map(voice => (
        <Option key={voice.id} value={voice.id}>
          {voice.name}
        </Option>
      ))}
    </Select>
  );
}

export function usePollinationsVoiceDropdown(disabled?: boolean) {
  const [voiceId, setVoiceId] = React.useState<string | null>(POLLINATIONS_VOICES[0].id);
  const voicesDropdown = React.useMemo(() =>
      <VoicesDropdown
        disabled={disabled}
        voices={POLLINATIONS_VOICES}
        voiceId={voiceId}
        setVoiceId={setVoiceId}
      />,
    [voiceId, disabled],
  );
  return {
    voiceId,
    voicesDropdown,
  };
}
