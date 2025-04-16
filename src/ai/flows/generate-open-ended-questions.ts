'use server';
/**
 * @fileOverview Generates open-ended questions from input text using the Gemini API.
 *
 * - generateOpenEndedQuestions - A function that generates open-ended questions from the provided text.
 * - GenerateOpenEndedQuestionsInput - The input type for the generateOpenEndedQuestions function.
 * - GenerateOpenEndedQuestionsOutput - The return type for the generateOpenEndedQuestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateOpenEndedQuestionsInputSchema = z.object({
  text: z.string().describe('The text to generate the open-ended questions from.'),
});
export type GenerateOpenEndedQuestionsInput = z.infer<typeof GenerateOpenEndedQuestionsInputSchema>;

const OpenEndedQuestionSchema = z.object({
  question: z.string().describe('The open-ended question.'),
  idealAnswer: z.string().describe('The ideal answer to the question.'),
});

const GenerateOpenEndedQuestionsOutputSchema = z.object({
  questions: z.array(OpenEndedQuestionSchema).length(4).describe('The generated open-ended questions and ideal answers.'),
});
export type GenerateOpenEndedQuestionsOutput = z.infer<typeof GenerateOpenEndedQuestionsOutputSchema>;

export async function generateOpenEndedQuestions(input: GenerateOpenEndedQuestionsInput): Promise<GenerateOpenEndedQuestionsOutput> {
  return generateOpenEndedQuestionsFlow(input);
}

const generateOpenEndedQuestionsPrompt = ai.definePrompt({
  name: 'generateOpenEndedQuestionsPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The text to generate the open-ended questions from.'),
    }),
  },
  output: {
    schema: z.object({
      questions: z.array(OpenEndedQuestionSchema).length(4).describe('The generated open-ended questions and ideal answers.'),
    }),
  },
  prompt: `You are an expert question generator. Generate 4 open-ended questions based on the following text. For each question, provide an ideal answer.

Text: {{{text}}}`,
});

const generateOpenEndedQuestionsFlow = ai.defineFlow<
  typeof GenerateOpenEndedQuestionsInputSchema,
  typeof GenerateOpenEndedQuestionsOutputSchema
>(
  {
    name: 'generateOpenEndedQuestionsFlow',
    inputSchema: GenerateOpenEndedQuestionsInputSchema,
    outputSchema: GenerateOpenEndedQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateOpenEndedQuestionsPrompt(input);
    return output!;
  }
);
