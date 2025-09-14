## System Architecture

The Unselfisheologism/big-agi system has been rearchitected to use puter.js as the sole AI provider. The architecture is designed as a local-first solution with the following components:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            Big-AGI User Interface                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                            Application Logic Layer                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                               puter.js Engine                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐ │
│   │ Text Gen    │   │ Image Gen   │   │ TTS/STT     │   │ Model Manager   │ │
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Text Generation Module

- **Input Processing**: Handles all text input from the chat interface
- **Model Selection**: Chooses the appropriate model size based on request complexity
- **Prompt Formatting**: Converts user requests to the format expected by puter.js
- **Response Handling**: Processes puter.js responses and formats them for display

### 2. Image Generation Module

- **Prompt Parsing**: Extracts image generation parameters from user requests
- **Model Selection**: Selects appropriate image generation model
- **Image Processing**: Handles image generation requests and processes responses
- **Output Formatting**: Converts generated images to displayable format

### 3. TTS/STT Module

- **Speech Recognition**: Handles microphone input and converts to text
- **Text-to-Speech**: Converts text responses to audio
- **Voice Selection**: Manages different voice options
- **Audio Processing**: Handles audio playback and recording

### 4. Model Manager

- **Model Catalog**: Maintains a list of available puter.js models
- **Model Download**: Handles downloading new models
- **Model Versioning**: Manages different model versions
- **Storage Management**: Handles local storage of models

## Integration Points

1. **API Layer Replacement**
   - All existing AI provider API calls have been replaced with puter.js API calls
   - The new API layer is located in `src/modules/llms/vendors/puter`
   - All vendor-specific code has been removed

2. **Configuration System**
   - Environment variables for external providers have been removed
   - New configuration system for puter.js is located in `src/server/env.ts`
   - UI configuration has been updated to remove provider selection

3. **UI Changes**
   - Removed all provider selection UI elements
   - Added puter.js-specific settings UI
   - Updated model selection interface to show only puter.js models

4. **Data Flow**
   - All data processing now happens through puter.js
   - No external API calls are made to third-party services
   - All model weights are stored locally or in user-controlled storage

## Technical Implementation Details

1. **File Structure Changes**
   - Removed all vendor-specific directories under `src/modules/llms/vendors/`
   - Created new `puter` directory under `src/modules/llms/vendors/`
   - Updated all references to external providers with puter.js references

2. **Database Changes**
   - Removed all external API key storage
   - Added local model storage management system
   - Updated database schema to support puter.js-specific metadata

3. **Build Process**
   - Updated build scripts to include puter.js model files
   - Added pre-build steps to download necessary models
   - Updated Docker and Kubernetes configurations for local deployment

4. **Security Model**
   - Removed all API key management code
   - Implemented local encryption for sensitive data
   - Added data isolation between different user sessions
