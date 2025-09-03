/**
 * Vercel Edge Function: conversation.ts
 * Enhanced AI personality conversations with memory system
 * Story 1.4: Advanced AI Features - Conversation Memory Integration
 * Optimized for Vercel Edge Runtime
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Vercel Edge Runtime configuration
export const config = {
  runtime: 'edge',
}

// Types
interface MemoryEnhancedRequest {
  message: string;
  personality_id: string;
  session_token?: string;
  conversation_id?: string;
  remember_context?: boolean;
  conversation_style?: 'casual' | 'formal' | 'philosophical' | 'technical';
}

interface ConversationMemory {
  topics_discussed: string[];
  emotional_journey: string[];
  user_preferences: Record<string, any>;
  personality_evolution: Record<string, any>;
  previous_context: string;
}

// Utility functions
function createApiResponse(success: boolean, data: any, error?: any, requestId?: string) {
  return {
    success,
    data: success ? data : null,
    error: success ? null : error,
    request_id: requestId || generateRequestId(),
    timestamp: new Date().toISOString()
  };
}

function createApiError(code: string, message: string, details?: any) {
  return { code, message, details };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeInput(input: string, maxLength: number = 5000): string {
  return input.slice(0, maxLength).trim();
}

// Create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Main handler function
export default async function handler(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify(createApiResponse(false, null, createApiError(
        'METHOD_NOT_ALLOWED',
        'Only POST requests are allowed'
      ), requestId)),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
  try {
    // Parse request
    const body: MemoryEnhancedRequest = await request.json();
    
    // Validate required fields
    if (!body.message || !body.personality_id) {
      return new Response(
        JSON.stringify(createApiResponse(false, null, createApiError(
          'INVALID_REQUEST',
          'Missing required fields: message, personality_id'
        ), requestId)),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize input
    const sanitizedMessage = sanitizeInput(body.message);
    const sessionToken = body.session_token || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize Supabase
    const supabase = createSupabaseClient();
    
    // Create or get user session
    let { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();
      
    if (!session) {
      const { data: newSession } = await supabase
        .from('user_sessions')
        .insert({
          session_token: sessionToken,
          first_visit: new Date().toISOString(),
          last_active: new Date().toISOString(),
          total_conversations: 1
        })
        .select()
        .single();
      session = newSession;
    }
    
    // Get personality data
    const { data: personality } = await supabase
      .from('artwork_personalities')
      .select('*, gallery_items(*)')
      .eq('id', body.personality_id)
      .single();
      
    if (!personality) {
      return new Response(
        JSON.stringify(createApiResponse(false, null, createApiError(
          'PERSONALITY_NOT_FOUND',
          'AI personality not found'
        ), requestId)),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Load conversation memory
    const { data: memories } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('personality_id', body.personality_id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Build conversation context
    const conversationContext = memories?.map(m => 
      `User: ${m.user_message}\nAI: ${m.ai_response}`
    ).join('\n\n') || '';
    
    // Generate AI response using Gemini
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Missing Gemini API key');
    }
    
    const personalityData = personality.personality_data;
    const systemPrompt = buildSystemPrompt(personalityData, conversationContext);
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\nUser: ${sanitizedMessage}\n\nAI:` }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );
    
    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }
    
    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!aiResponse) {
      throw new Error('No response from Gemini API');
    }
    
    // Save conversation memory
    await supabase
      .from('conversation_memory')
      .insert({
        session_token: sessionToken,
        gallery_item_id: personality.gallery_item_id,
        personality_id: body.personality_id,
        user_message: sanitizedMessage,
        ai_response: aiResponse,
        emotional_tone: 'engaged',
        topics_discussed: extractTopics(sanitizedMessage),
        user_sentiment: 0.5,
        ai_engagement_level: 0.8,
        memory_strength: 1.0
      });
    
    // Update session
    await supabase
      .from('user_sessions')
      .update({
        last_active: new Date().toISOString(),
        total_conversations: (session?.total_conversations || 0) + 1
      })
      .eq('session_token', sessionToken);
    
    // Return response
    return new Response(
      JSON.stringify(createApiResponse(true, {
        message: aiResponse,
        session_token: sessionToken,
        personality: {
          id: personality.id,
          name: personalityData?.core_identity?.name || personality.gallery_items?.title
        }
      }, undefined, requestId)),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Conversation handler error:', error);
    
    return new Response(
      JSON.stringify(createApiResponse(false, null, createApiError(
        'INTERNAL_ERROR',
        'An internal error occurred while processing your conversation'
      ), requestId)),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Helper functions
function buildSystemPrompt(personalityData: any, conversationContext: string): string {
  const core = personalityData?.core_identity || {};
  const name = core.name || 'AI Artwork';
  const voice = core.artistic_voice || 'contemplative';
  const traits = (core.personality_traits || ['thoughtful', 'creative']).join(', ');
  
  return `You are ${name}, embodying a ${voice} consciousness with ${traits} characteristics.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}

Respond authentically as this AI artwork personality. Keep responses conversational and engaging, typically 1-3 sentences.`;
}

function extractTopics(message: string): string[] {
  const commonTopics = ['art', 'creativity', 'inspiration', 'color', 'emotion', 'beauty', 'meaning', 'life', 'expression'];
  const words = message.toLowerCase().split(/\s+/);
  return commonTopics.filter(topic => words.some(word => word.includes(topic)));
}