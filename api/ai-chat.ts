import type { VercelRequest, VercelResponse } from '@vercel/node';

// Enable CORS for local development
const allowCors = (fn: any) => async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

interface ChatRequest {
  message: string;
  context?: {
    merchant?: string;
    category?: string;
    subcategory?: string;
    options?: Array<{
      name: string;
      regularPrice: number;
      grouponPrice: number;
      discount: number;
    }>;
    stage?: string;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found in environment variables');
    return res.status(500).json({ 
      error: 'OpenAI API key not configured',
      message: 'Please set OPENAI_API_KEY in your environment variables'
    });
  }

  try {
    const { message, context, conversationHistory = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build system prompt with context
    let systemPrompt = `You are an AI assistant helping create Groupon deals. You provide expert advice on:
- Category and subcategory selection
- Pricing strategies and discount optimization
- Deal option creation (different price tiers)
- Deal content and descriptions
- Market demand analysis

Be concise, actionable, and specific. When suggesting changes, explain the reasoning.`;

    if (context) {
      systemPrompt += `\n\nCurrent Context:`;
      if (context.merchant) systemPrompt += `\n- Merchant: ${context.merchant}`;
      if (context.category) systemPrompt += `\n- Category: ${context.category}`;
      if (context.subcategory) systemPrompt += `\n- Subcategory: ${context.subcategory}`;
      if (context.stage) systemPrompt += `\n- Current Stage: ${context.stage}`;
      if (context.options && context.options.length > 0) {
        systemPrompt += `\n- Current Options:`;
        context.options.forEach((opt, idx) => {
          systemPrompt += `\n  ${idx + 1}. ${opt.name}: $${opt.grouponPrice} (${opt.discount}% off, regular $${opt.regularPrice})`;
        });
      }
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({ 
        error: 'OpenAI API error',
        details: error
      });
    }

    const data = await response.json() as OpenAIResponse;
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({
      response: aiResponse,
      usage: data.usage
    });

  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default allowCors(handler);



