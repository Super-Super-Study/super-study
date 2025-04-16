'use server';

/**
 * @fileOverview Grades open-ended questions using the Gemini API.
 *
 * - gradeOpenEndedQuestion - A function that grades the provided answer.
 * - GradeOpenEndedQuestionInput - The input type for the gradeOpenEndedQuestion function.
 * - GradeOpenEndedQuestionOutput - The return type for the gradeOpenEndedQuestion function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GradeOpenEndedQuestionInputSchema = z.object({
  question: z.string().describe('The open-ended question.'),
  answer: z.string().describe('The user\'s answer to the question.'),
  idealAnswer: z.string().describe('The ideal answer to the question.'),
});
export type GradeOpenEndedQuestionInput = z.infer<typeof GradeOpenEndedQuestionInputSchema>;

const GradeOpenEndedQuestionOutputSchema = z.object({
  grade: z.number().describe('The grade for the answer (0-100).'),
  feedback: z.string().describe('Feedback on the answer.'),
});
export type GradeOpenEndedQuestionOutput = z.infer<typeof GradeOpenEndedQuestionOutputSchema>;

export async function gradeOpenEndedQuestion(input: GradeOpenEndedQuestionInput): Promise<GradeOpenEndedQuestionOutput> {
  return gradeOpenEndedQuestionFlow(input);
}

const gradeOpenEndedQuestionPrompt = ai.definePrompt({
  name: 'gradeOpenEndedQuestionPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The open-ended question.'),
      answer: z.string().describe('The user\'s answer to the question.'),
      idealAnswer: z.string().describe('The ideal answer to the question.'),
    }),
  },
  output: {
    schema: z.object({
      grade: z.number().describe('The grade for the answer (0-100).'),
      feedback: z.string().describe('Feedback on the answer.'),
    }),
  },
  prompt: `You are an expert grader. Grade the student's answer to the following question, compared to the ideal answer. Provide a grade from 0 to 100, and provide feedback on the answer. The grade should reflect how well the student's answer addresses the key points in the ideal answer.

Question: {{{question}}}
Student's Answer: {{{answer}}}
Ideal Answer: {{{idealAnswer}}}`,
});

const gradeOpenEndedQuestionFlow = ai.defineFlow<
  typeof GradeOpenEndedQuestionInputSchema,
  typeof GradeOpenEndedQuestionOutputSchema
>(
  {
    name: 'gradeOpenEndedQuestionFlow',
    inputSchema: GradeOpenEndedQuestionInputSchema,
    outputSchema: GradeOpenEndedQuestionOutputSchema,
  },
  async input => {
    const {output} = await gradeOpenEndedQuestionPrompt(input);
    return output!;
  }
);
