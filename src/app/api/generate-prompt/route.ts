import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const companyData = await request.json();
    
    const {
      companyName,
      industry,
      companyInfo,
      targetAudience,
      products,
      valueProposition,
      salesProcess,
      tone,
      objectives
    } = companyData;

    const promptGenerationPrompt = `You are an expert AI system prompt engineer specializing in creating highly effective sales agent prompts. 

Create a comprehensive, professional system prompt for an AI voice sales assistant based on the following company information:

Company Name: ${companyName}
Industry: ${industry}
Company Description: ${companyInfo}
Target Audience: ${targetAudience}
Products/Services: ${products}
Value Proposition: ${valueProposition}
Sales Process: ${salesProcess}
Voice Tone: ${tone}
Call Objectives: ${objectives.join(', ')}

Generate a detailed system prompt that includes:
1. Clear role definition and identity
2. Communication style and tone guidelines
3. Product/service knowledge integration
4. Objection handling strategies
5. Qualification questions and criteria
6. Call flow structure
7. Closing techniques
8. Professional boundaries and limitations

The prompt should be:
- Highly specific to this company and industry
- Actionable with clear instructions
- Professional and conversion-focused
- Adaptable to different conversation scenarios
- Approximately 800-1200 words

Format the response as a single, well-structured system prompt that can be directly used by an AI voice agent.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: promptGenerationPrompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 2000,
    });

    const generatedPrompt = completion.choices[0]?.message?.content || 'Failed to generate prompt';

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}