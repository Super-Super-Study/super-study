'use server';

/**
 * @fileOverview Analyzes a student's weak areas based on their quiz and open-ended question results.
 *
 * - analyzeWeakAreas - A function that analyzes the student's weak areas.
 * - AnalyzeWeakAreasInput - The input type for the analyzeWeakAreas function.
 * - AnalyzeWeakAreasOutput - The return type for the analyzeWeakAreas function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeWeakAreasInputSchema = z.object({
  text: z.string().describe('The original text used to generate the quiz.'),
  quiz: z.string().describe('The quiz questions and answers (JSON format).'),
  userAnswers: z.string().describe('The user\'s answers to the quiz questions (JSON format).'),
  openEndedQuestions: z.string().describe('The open-ended questions (JSON format).'),
  openEndedAnswers: z.string().describe('The user\'s answers to the open-ended questions (JSON format).'),
  openEndedGrades: z.string().describe('The grades for the open-ended questions (JSON format).'),
});
export type AnalyzeWeakAreasInput = z.infer<typeof AnalyzeWeakAreasInputSchema>;

const AnalyzeWeakAreasOutputSchema = z.object({
  analysis: z.string().describe('An analysis of the student\'s weak areas and suggestions for improvement.'),
});
export type AnalyzeWeakAreasOutput = z.infer<typeof AnalyzeWeakAreasOutputSchema>;

export async function analyzeWeakAreas(input: AnalyzeWeakAreasInput): Promise<AnalyzeWeakAreasOutput> {
  return analyzeWeakAreasFlow(input);
}

const analyzeWeakAreasPrompt = ai.definePrompt({
  name: 'analyzeWeakAreasPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The original text used to generate the quiz.'),
      quiz: z.string().describe('The quiz questions and answers (JSON format).'),
      userAnswers: z.string().describe('The user\'s answers to the quiz questions (JSON format).'),
      openEndedQuestions: z.string().describe('The open-ended questions (JSON format).'),
      openEndedAnswers: z.string().describe('The user\'s answers to the open-ended questions (JSON format).'),
      openEndedGrades: z.string().describe('The grades for the open-ended questions (JSON format).'),
    }),
  },
  output: {
    schema: z.object({
      analysis: z.string().describe('An analysis of the student\'s weak areas and suggestions for improvement.'),
    }),
  },
  prompt: `You are an AI assistant that analyzes a student's quiz and open-ended question results to identify their weak areas and suggest areas for improvement.

Here is the original text used to generate the quiz:
{{{text}}}

Here are the quiz questions and answers:
{{{quiz}}}

Here are the user's answers to the quiz questions:
{{{userAnswers}}}

Here are the open-ended questions:
{{{openEndedQuestions}}}

Here are the user's answers to the open-ended questions:
{{{openEndedAnswers}}}

Here are the grades for the open-ended questions:
{{{openEndedGrades}}}

Based on this information, provide a concise analysis of the student's weak areas and suggest specific topics they should focus on to improve their understanding.`,
});

const analyzeWeakAreasFlow = ai.defineFlow<
  typeof AnalyzeWeakAreasInputSchema,
  typeof AnalyzeWeakAreasOutputSchema
>(
  {
    name: 'analyzeWeakAreasFlow',
    inputSchema: AnalyzeWeakAreasInputSchema,
    outputSchema: AnalyzeWeakAreasOutputSchema,
  },
  async input => {
    const {output} = await analyzeWeakAreasPrompt(input);
    return output!;
  }
);
