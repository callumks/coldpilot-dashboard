import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/ai/email-generation - Generate AI-powered email content
export async function POST(request: NextRequest) {
  try {
    console.log('✍️ AI Email Generation request received');

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription access for AI features
    if (!user.subscription || !['PRO', 'AGENCY'].includes(user.subscription.plan)) {
      return NextResponse.json(
        { error: 'AI Email Generation requires Pro or Agency plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      campaignGoal,
      targetIndustry,
      contactInfo,
      tone = 'professional',
      emailType = 'initial_outreach',
      companyInfo,
      customInstructions 
    } = body;

    // Validate required fields
    if (!campaignGoal || !targetIndustry) {
      return NextResponse.json(
        { error: 'Campaign goal and target industry are required' },
        { status: 400 }
      );
    }

    // Generate AI email content
    const emailContent = await generateEmailWithAI({
      campaignGoal,
      targetIndustry,
      contactInfo,
      tone,
      emailType,
      companyInfo,
      customInstructions,
      userInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

    return NextResponse.json({
      success: true,
      emailContent,
      message: 'Email content generated successfully'
    });

  } catch (error) {
    console.error('AI Email Generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// AI Email Generation Implementation
async function generateEmailWithAI(params: {
  campaignGoal: string;
  targetIndustry: string;
  contactInfo?: any;
  tone: string;
  emailType: string;
  companyInfo?: any;
  customInstructions?: string;
  userInfo: any;
}) {
  const {
    campaignGoal,
    targetIndustry,
    contactInfo,
    tone,
    emailType,
    companyInfo,
    customInstructions,
    userInfo
  } = params;

  console.log('🤖 Generating AI email content...', { campaignGoal, targetIndustry, tone });

  // Build GPT-4 prompt
  const prompt = buildEmailPrompt({
    campaignGoal,
    targetIndustry,
    contactInfo,
    tone,
    emailType,
    companyInfo,
    customInstructions,
    userInfo
  });

  // TODO: Replace with actual OpenAI API call
  const gptResponse = await callOpenAIAPI(prompt);

  // Parse and structure the response
  const parsedContent = parseAIEmailResponse(gptResponse);

  return parsedContent;
}

function buildEmailPrompt(params: any) {
  const {
    campaignGoal,
    targetIndustry,
    contactInfo,
    tone,
    emailType,
    companyInfo,
    customInstructions,
    userInfo
  } = params;

  const contactContext = contactInfo ? `
Contact Information:
- Name: ${contactInfo.name}
- Company: ${contactInfo.company}
- Position: ${contactInfo.position}
- Industry: ${contactInfo.industry || targetIndustry}
` : '';

  const companyContext = companyInfo ? `
Your Company:
- Name: ${companyInfo.name}
- Description: ${companyInfo.description}
- Value Proposition: ${companyInfo.valueProposition}
` : '';

  const prompt = `You are an expert cold email copywriter. Generate a high-converting cold outreach email with the following specifications:

CAMPAIGN DETAILS:
- Goal: ${campaignGoal}
- Target Industry: ${targetIndustry}
- Email Type: ${emailType}
- Tone: ${tone}

${contactContext}

${companyContext}

SENDER INFO:
- Name: ${userInfo.firstName} ${userInfo.lastName}
- Email: ${userInfo.email}

${customInstructions ? `CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ''}

REQUIREMENTS:
1. Generate 3 subject line variations
2. Write a compelling email body (150-200 words max)
3. Include a clear call-to-action
4. Use personalization where possible
5. Avoid spam trigger words
6. Make it conversational and human

TONE GUIDELINES:
- Professional: Formal but approachable
- Casual: Friendly and conversational  
- Direct: Straight to the point
- Humorous: Light and engaging (but professional)

FORMAT YOUR RESPONSE AS JSON:
{
  "subjectLines": ["Subject 1", "Subject 2", "Subject 3"],
  "emailBody": "Email content here...",
  "callToAction": "Clear CTA text",
  "personalizations": ["Variable 1", "Variable 2"],
  "spamScore": "Low/Medium/High",
  "tips": ["Tip 1", "Tip 2"]
}`;

  return prompt;
}

async function callOpenAIAPI(prompt: string) {
  console.log('🔮 Calling OpenAI GPT-4 API...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cold email copywriter. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response (robust to code fences / extra text)
    try {
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '');
      // Attempt direct parse
      try {
        const parsed = JSON.parse(cleaned);
        console.log('✅ Successfully generated AI email content');
        return parsed;
      } catch {
        // Fallback: extract first JSON block via regex
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          console.log('✅ Parsed AI email content from embedded JSON');
          return parsed;
        }
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

  } catch (error) {
    console.error('OpenAI API call failed:', error);
    
    // Fallback to enhanced mock response
    return {
      subjectLines: [
        "Quick question about {{company}}'s growth strategy",
        "5-minute chat about scaling {{company}}?", 
        "{{name}}, noticed your {{industry}} expansion"
      ],
      emailBody: `Hi {{name}},

I noticed {{company}} has been making waves in the {{industry}} space. Impressive growth trajectory!

We've helped similar companies streamline operations and boost efficiency by 40%+ on average. Given your role as {{position}}, I thought this might be relevant.

Would you be open to a brief 15-minute conversation about how we might support {{company}}'s continued success?

Best regards,
{{senderName}}`,
      callToAction: "Schedule a brief call",
      personalizations: ["{{name}}", "{{company}}", "{{position}}", "{{industry}}", "{{senderName}}"],
      spamScore: "Low",
      tips: [
        "AI fallback used - check OpenAI API key",
        "Personalize with specific company details",
        "Keep emails under 150 words for better response rates"
      ],
      isAIGenerated: false // Indicates fallback was used
    };
  }
}

function parseAIEmailResponse(response: any) {
  // In a real implementation, this would parse the OpenAI response
  // and handle any formatting or validation needed
  
  console.log('📝 Parsing AI response...');
  
  return {
    ...response,
    generatedAt: new Date().toISOString(),
    model: 'gpt-4',
    version: '1.0'
  };
}