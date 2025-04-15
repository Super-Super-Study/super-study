'use server';
/**
 * @fileOverview Generates a quiz from input text using the Gemini API.
 *
 * - generateQuiz - A function that generates a quiz from the provided text.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  text: z.string().describe('The text to generate the quiz from.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      answer: z.string().describe('The correct answer.'),
      correctAnswerExplanation: z.string().describe('Explanation of why the answer is correct.'),
    })
  ).describe('The generated quiz questions and answers.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The text to generate the quiz from.'),
    }),
  },
  output: {
    schema: z.object({
      quiz: z.array(
        z.object({
          question: z.string().describe('The quiz question.'),
          options: z.array(z.string()).describe('The possible answers.'),
          answer: z.string().describe('The correct answer.'),
          correctAnswerExplanation: z.string().describe('Explanation of why the answer is correct.'),
        })
      ).describe('The generated quiz questions and answers.'),
    }),
  },
  prompt: `You are a quiz generator. Generate a quiz based on the following text. The quiz should have multiple choice questions. Each question should have 4 options, one of which is the correct answer. For each question, provide a brief explanation of why the correct answer is correct in the correctAnswerExplanation field. Return the quiz as a JSON object.

Text: {{{text}}}`,
});

const generateQuizFlow = ai.defineFlow<
  typeof GenerateQuizInputSchema,
  typeof GenerateQuizOutputSchema
>(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
