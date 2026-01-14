import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local (or .env as fallback)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Fallback to .env

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'https://voiceagent.rajeev-d.workers.dev',
    'https://hospitalvoiceagent.rajeev-d.workers.dev',
    'https://update-worker-name-to-hospitalvoiceagent-hospitalvoiceagent.rajeev-d.workers.dev',
    'https://hospitalvoiceagent.onrender.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.sendStatus(200);
});

app.use(express.json());

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log(`   Headers:`, Object.keys(req.headers));
  next();
});

// Determine environment
// Check if we're using local Pipecat instance or cloud
const LOCAL_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.LOCAL_PIPECAT_URL;
const IS_LOCAL = !!LOCAL_API_BASE_URL;
const AGENT_NAME = process.env.AGENT_NAME || '';

// Debug: Log environment variables (without sensitive data)
console.log('Environment check:');
console.log(`  IS_LOCAL: ${IS_LOCAL}`);
console.log(`  AGENT_NAME: ${AGENT_NAME || 'NOT SET'}`);
console.log(`  HAS_PIPECAT_KEY: ${!!process.env.PIPECAT_CLOUD_API_KEY}`);
console.log(`  PORT: ${PORT}`);

if (!AGENT_NAME && !IS_LOCAL) {
  console.warn('⚠️  Warning: AGENT_NAME environment variable is not set (required for cloud mode)');
  console.warn('   Make sure .env.local exists in the project root with AGENT_NAME=your_agent_name');
}

const API_BASE_URL = IS_LOCAL
  ? LOCAL_API_BASE_URL
  : `https://api.pipecat.daily.co/v1/public/${AGENT_NAME}`;

// const API_BASE_URL= "https://smart-mutually-grubworm.ngrok-free.app";

// Track in-flight requests to prevent duplicates
interface InFlightRequest {
  timestamp: number;
  promise: Promise<any>;
}

const inFlightRequests = new Map<string, InFlightRequest>();
const REQUEST_DEDUP_WINDOW_MS = 2000; // 2 seconds window to deduplicate requests

// Cleanup old requests periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, request] of inFlightRequests.entries()) {
    if (now - request.timestamp > REQUEST_DEDUP_WINDOW_MS) {
      inFlightRequests.delete(key);
    }
  }
}, 5000); // Clean up every 5 seconds

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to verify server is accessible
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is working', timestamp: new Date().toISOString() });
});

// Connect endpoint
app.post('/api/connect', async (req, res) => {
  console.log('✅ POST /api/connect route hit!');
  try {
    // Get voiceAgentName from query parameter (passed via URL) or request body
    const voiceAgentName = req.query.voiceAgentName as string || req.body.voiceAgentName;

    console.log('Received connect request:', {
      query: req.query,
      body: req.body,
      voiceAgentName,
    });

    // Validate voiceAgentName exists
    if (!voiceAgentName) {
      console.error('Missing voiceAgentName in request (check query params or body)');
      return res.status(400).json({
        error: 'voiceAgentName is required (as query parameter or in request body)',
      });
    }

    // Create a unique key for this request (voiceAgentName + query params hash)
    const requestKey = `${voiceAgentName}-${JSON.stringify(req.query)}`;

    // Check if there's an in-flight request for this key
    const existingRequest = inFlightRequests.get(requestKey);
    if (existingRequest) {
      const age = Date.now() - existingRequest.timestamp;
      if (age < REQUEST_DEDUP_WINDOW_MS) {
        console.log(`⏭️ Duplicate request detected (${age}ms old), reusing existing request for: ${voiceAgentName}`);
        try {
          const result = await existingRequest.promise;
          return res.status(200).json(result);
        } catch (error: any) {
          // If the existing request failed, remove it and continue with new request
          inFlightRequests.delete(requestKey);
          console.log('⚠️ Existing request failed, creating new request');
        }
      } else {
        // Request is too old, remove it
        inFlightRequests.delete(requestKey);
      }
    }

    console.log(`Connecting voice agent: ${voiceAgentName}`);

    // Extract agent data from query parameters (passed via URL) or request body
    const systemInstruction = (req.query.systemInstruction as string) || req.body.systemInstruction;
    const voiceName = (req.query.voiceName as string) || req.body.voiceName;
    const phoneNumber = (req.query.phoneNumber as string) || req.body.phoneNumber;
    // Extract name from query (sent as 'name') and map to userName
    const userName = (req.query.name as string) || req.body.name || req.body.userName;
    const orderId = (req.query.orderId as string) || req.body.orderId;
    const requestData = req.body;
    const { voiceAgentName: _, ...otherData } = requestData; // Exclude voiceAgentName from body if present

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!IS_LOCAL && process.env.PIPECAT_CLOUD_API_KEY) {
      headers.Authorization = `Bearer ${process.env.PIPECAT_CLOUD_API_KEY}`;
    }

    // Include voiceAgentName and agent-specific data in custom body sent to bot
    const customBody = {
      voiceAgentName,
      // Include agent data from query params or body
      ...(systemInstruction && { systemInstruction }),
      ...(voiceName && { voiceName }),
      ...(phoneNumber && { phoneNumber }),
      ...(userName && { userName }),
      ...(orderId && { orderId }),
      // Include any additional data from request body
      ...otherData,
    };

    const pipecatRequest = {
      createDailyRoom: true,
      dailyRoomProperties: { start_video_off: true },
      body: customBody, // Includes voiceAgentName
    };

    console.log('Sending request to Pipecat:', {
      url: `${API_BASE_URL}/start`,
      hasAuth: !!headers.Authorization,
      requestBody: pipecatRequest,
    });

    // Create a promise for this request that processes the full response
    const pipecatRequestPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pipecatRequest),
      });

      console.log('Pipecat API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status: ${response.status} - ${errorText}`);
      }

      // Read the response body once
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse Pipecat response: ${parseError}`);
      }

      // Handle both field name formats (room_url/token or dailyRoom/dailyToken)
      // Pipecat API returns dailyRoom and dailyToken, but client expects room_url and token
      const roomUrl = data.room_url || data.dailyRoom;
      const token = data.token || data.dailyToken;

      // Ensure we return the expected format with room_url and token
      // Include voiceAgentName in response
      const responseData = {
        room_url: roomUrl, // Normalize to room_url
        token: token, // Normalize to token
        sessionId: data.sessionId,
        voiceAgentName, // Add voice agent name to response
      };

      return { response, data, responseData };
    })();

    // Store the request promise (store the full responseData for duplicate requests)
    inFlightRequests.set(requestKey, {
      timestamp: Date.now(),
      promise: pipecatRequestPromise.then(result => result.responseData),
    });

    // Await the full promise to get response, data, and responseData
    const { response, data, responseData } = await pipecatRequestPromise;

    // Log the response for debugging
    const roomUrl = responseData.room_url;
    const token = responseData.token;
    console.log('✅ Pipecat API response received:', {
      hasRoomUrl: !!roomUrl,
      hasToken: !!token,
      roomUrl: roomUrl ? `${roomUrl.substring(0, 50)}...` : 'MISSING',
      tokenLength: token ? token.length : 0,
      keys: Object.keys(data),
      fullResponse: JSON.stringify(data).substring(0, 500), // First 500 chars for debugging
    });

    if (!roomUrl || !token) {
      console.error('❌ Missing required fields in Pipecat response:', {
        hasRoomUrl: !!roomUrl,
        hasToken: !!token,
        fullResponse: data,
      });
    } else {
      console.log('✅ Daily room credentials received successfully');
      console.log('   Room URL:', roomUrl);
      console.log('   Token length:', token.length);
    }

    // Set proper headers
    res.setHeader('Content-Type', 'application/json');

    // Remove completed request from cache after a short delay
    // (allow other duplicate requests to use the same response)
    setTimeout(() => {
      inFlightRequests.delete(requestKey);
    }, REQUEST_DEDUP_WINDOW_MS);

    console.log('Sending response to client');
    return res.status(200).json(responseData);
  } catch (error: any) {
    // Remove failed request from cache
    const voiceAgentName = req.query.voiceAgentName as string || req.body.voiceAgentName;
    const requestKey = `${voiceAgentName}-${JSON.stringify(req.query)}`;
    inFlightRequests.delete(requestKey);

    console.error('API error:', error);
    return res.status(500).json({
      error: 'Failed to start agent',
      details: error.message,
    });
  }
});

// Catch-all route for debugging 404s
app.use((req, res) => {
  console.warn(`⚠️  404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path,
    availableRoutes: ['/health', '/api/test', '/api/connect'],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express API server running on port ${PORT}`);
  console.log(`📡 Environment: ${IS_LOCAL ? 'LOCAL' : 'CLOUD'}`);
  console.log(`🤖 Agent Name: ${AGENT_NAME || 'NOT SET'}`);
  console.log(`🌐 CORS enabled for: http://localhost:3000, http://localhost:5173`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /api/test - Test endpoint`);
  console.log(`  POST /api/connect - Connect to Pipecat agent`);
});

