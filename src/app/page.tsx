'use client';

import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateQuiz} from '@/ai/flows/generate-quiz-from-text';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Check, X} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {gradeOpenEndedQuestion} from '@/ai/flows/grade-open-ended-question';

type MultipleChoiceQuestion = {
  type: 'multipleChoice';
  question: string;
  options: string[];
  answer: string;
  correctAnswerExplanation: string;
};

type OpenEndedQuestion = {
  type: 'openEnded';
  question: string;
  idealAnswer: string;
};

type Question = MultipleChoiceQuestion | OpenEndedQuestion;

const initialQuestions: Question[] = [
  {
    type: 'openEnded',
    question: 'What are the key principles of responsive web design?',
    idealAnswer:
      'The key principles include fluid grids, flexible images, and media queries.',
  },
  {
    type: 'openEnded',
    question: 'Explain the concept of server-side rendering (SSR) in Next.js.',
    idealAnswer:
      'SSR involves rendering React components on the server and sending the HTML to the client, improving SEO and initial load time.',
  },
  {
    type: 'openEnded',
    question: 'Describe the advantages of using TypeScript in a Next.js project.',
    idealAnswer:
      'TypeScript provides static typing, improved code maintainability, and enhanced developer productivity.',
  },
  {
    type: 'openEnded',
    question: 'How does Next.js handle routing and navigation?',
    idealAnswer:
      'Next.js uses a file-system-based router for easy navigation and supports dynamic routes.',
  },
];

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quiz, setQuiz] = useState<MultipleChoiceQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [openEndedAnswers, setOpenEndedAnswers] = useState<string[]>(
    initialQuestions.map(() => '')
  );
  const [openEndedGrades, setOpenEndedGrades] = useState<number[]>(
    initialQuestions.map(() => 0)
  );
  const [openEndedFeedback, setOpenEndedFeedback] = useState<string[]>(
    initialQuestions.map(() => '')
  );
  const [score, setScore] = useState(0);
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [openEndedQuestionsGenerated, setOpenEndedQuestionsGenerated] =
    useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleQuizGeneration = async () => {
    if (!inputText) {
      alert('Please enter text to generate a quiz.');
      return;
    }

    const generatedQuiz = await generateQuiz({text: inputText});
    setQuiz(
      generatedQuiz.quiz.map(q => ({
        ...q,
        type: 'multipleChoice',
      }))
    );
    setUserAnswers(Array(generatedQuiz.quiz.length).fill(''));
    setScore(0);
    setQuizGenerated(true);
    setShowFeedback(false);
  };

  const handleAnswerSelection = (questionIndex: number, answer: string) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[questionIndex] = answer;
    setUserAnswers(newUserAnswers);
  };

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    quiz.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setShowFeedback(true);
  };

  const handleResetQuiz = () => {
    setUserAnswers(Array(quiz.length).fill(''));
    setScore(0);
    setShowFeedback(false);
  };

  const handleOpenEndedAnswerChange = (
    index: number,
    answer: string
  ): void => {
    const newAnswers = [...openEndedAnswers];
    newAnswers[index] = answer;
    setOpenEndedAnswers(newAnswers);
  };

  const handleGradeOpenEndedQuestion = async () => {
    const grades = [];
    const feedbacks = [];

    for (let i = 0; i < initialQuestions.length; i++) {
      const question = initialQuestions[i];
      if (question.type === 'openEnded') {
        try {
          const result = await gradeOpenEndedQuestion({
            question: question.question,
            answer: openEndedAnswers[i],
            idealAnswer: question.idealAnswer,
          });
          grades.push(result.grade);
          feedbacks.push(result.feedback);
        } catch (error) {
          console.error('Error grading open-ended question:', error);
          grades.push(0);
          feedbacks.push('Error grading question. Please try again.');
        }
      } else {
        grades.push(0);
        feedbacks.push('');
      }
    }

    setOpenEndedGrades(grades);
    setOpenEndedFeedback(feedbacks);
    setOpenEndedQuestionsGenerated(true);
  };

  const calculateTotalScore = () => {
    let totalScore = score;
    openEndedGrades.forEach(grade => {
      totalScore += grade / initialQuestions.length;
    });
    return totalScore;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-secondary">
      <h1 className="text-3xl font-bold mb-4">Quizify AI</h1>
      <Textarea
        placeholder="Enter text to generate a quiz"
        className="w-full max-w-2xl mb-4"
        value={inputText}
        onChange={handleInputChange}
      />
      <Button
        onClick={handleQuizGeneration}
        className="mb-4 bg-primary text-primary-foreground"
      >
        Generate Quiz
      </Button>

      {quizGenerated && quiz.length > 0 ? (
        <div className="w-full max-w-2xl">
          {quiz.map((question, questionIndex) => (
            <Card key={questionIndex} className="mb-4">
              <CardHeader>
                <CardTitle>Question {questionIndex + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={cn(
                        'flex items-center p-2 rounded-md border border-muted cursor-pointer hover:bg-accent',
                        userAnswers[questionIndex] === option
                          ? question.answer === option
                            ? 'bg-success text-card-foreground'
                            : 'bg-primary text-primary-foreground'
                          : '',
                        userAnswers[questionIndex] === option &&
                          question.answer !== option &&
                          'line-through'
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={option}
                        checked={userAnswers[questionIndex] === option}
                        onChange={() =>
                          handleAnswerSelection(questionIndex, option)
                        }
                        className="sr-only"
                      />
                      <span className="ml-2">{option}</span>
                      {userAnswers[questionIndex] === option &&
                        (question.answer === option ? (
                          <Check
                            className="ml-auto h-4 w-4 text-green-500"
                            aria-label="Correct"
                          />
                        ) : (
                          <X
                            className="ml-auto h-4 w-4 text-red-500"
                            aria-label="Incorrect"
                          />
                        ))}
                    </label>
                  ))}
                </div>
              </CardContent>
              {showFeedback && (
                <CardFooter>
                  {userAnswers[questionIndex] === question.answer ? (
                    <div className="text-sm text-green-500">
                      Correct! {question.correctAnswerExplanation}
                    </div>
                  ) : userAnswers[questionIndex] ? (
                    <div className="text-sm text-red-500">
                      Incorrect. The correct answer is {question.answer}.{' '}
                      {question.correctAnswerExplanation}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No answer selected. The correct answer is {question.answer}.{' '}
                      {question.correctAnswerExplanation}
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}

          <div className="flex justify-between">
            <Button
              onClick={handleSubmitQuiz}
              className="bg-primary text-primary-foreground"
            >
              Submit Quiz
            </Button>
            <Button onClick={handleResetQuiz} variant="outline">
              Reset
            </Button>
          </div>

          {showFeedback && (
            <div className="mt-4 text-lg font-semibold">
              Your Score: {score} / {quiz.length}
            </div>
          )}
        </div>
      ) : (
        quizGenerated && (
          <p>No questions generated. Try a different input text.</p>
        )
      )}

      <h2 className="text-2xl font-bold mt-8 mb-4">Open-Ended Questions</h2>
      {initialQuestions.map((question, index) => (
        <Card key={index} className="mb-4 w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Open-Ended Question {index + 1}</CardTitle>
            <CardDescription>{question.question}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your answer here"
              className="w-full mb-2"
              value={openEndedAnswers[index]}
              onChange={e => handleOpenEndedAnswerChange(index, e.target.value)}
            />
            {openEndedQuestionsGenerated && (
              <div>
                <p>Grade: {openEndedGrades[index]}</p>
                <p>Feedback: {openEndedFeedback[index]}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleGradeOpenEndedQuestion}>Grade Answers</Button>
      {openEndedQuestionsGenerated && (
        <div className="mt-4 text-lg font-semibold">
          Total Score: {calculateTotalScore()}
        </div>
      )}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({className, ...props}, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
