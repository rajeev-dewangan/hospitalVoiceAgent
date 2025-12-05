<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jkcE3x0iUI-02IwYKnSPxXJekMQQ-x7y

## Run Locally

**Prerequisites:**  Node.js

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Pipecat Cloud Configuration
   PIPECAT_CLOUD_API_KEY=your_pipecat_cloud_api_key_here
   AGENT_NAME=your_pipecat_agent_name_here
   
   # API Server Configuration
   API_BASE_URL=http://localhost:3001
   PORT=3001
   
   # Optional: For local Pipecat development
   NEXT_PUBLIC_API_BASE_URL=http://localhost:7860
   ```

3. Start the API server (in one terminal):
   ```bash
   npm run dev:server
   ```

4. Start the frontend (in another terminal):
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000` and the API server at `http://localhost:3001`.
