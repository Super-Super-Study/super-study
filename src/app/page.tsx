'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateQuiz} from '@/ai/flows/generate-quiz-from-text';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Check, X} from 'lucide-react';
import {cn} from '@/lib/utils';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [quiz, setQuiz] = useState<
    {
      question: string;
      options: string[];
      answer: string;
    }[]
  >([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [quizGenerated, setQuizGenerated] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleQuizGeneration = async () => {
    if (!inputText) {
      alert('Please enter text to generate a quiz.');
      return;
    }

    const generatedQuiz = await generateQuiz({text: inputText});
    setQuiz(generatedQuiz.quiz);
    setUserAnswers(Array(generatedQuiz.quiz.length).fill(''));
    setScore(0);
    setQuizGenerated(true);
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
  };

  const handleResetQuiz = () => {
    setUserAnswers(Array(quiz.length).fill(''));
    setScore(0);
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
      <Button onClick={handleQuizGeneration} className="mb-4 bg-primary text-primary-foreground">
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
                        onChange={() => handleAnswerSelection(questionIndex, option)}
                        className="sr-only"
                      />
                      <span className="ml-2">{option}</span>
                      {userAnswers[questionIndex] === option &&
                        (question.answer === option ? (
                          <Check className="ml-auto h-4 w-4 text-green-500" aria-label="Correct" />
                        ) : (
                          <X className="ml-auto h-4 w-4 text-red-500" aria-label="Incorrect" />
                        ))}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button onClick={handleSubmitQuiz} className="bg-primary text-primary-foreground">
              Submit Quiz
            </Button>
            <Button onClick={handleResetQuiz} variant="outline">
              Reset
            </Button>
          </div>

          {score > 0 && (
            <div className="mt-4 text-lg font-semibold">
              Your Score: {score} / {quiz.length}
            </div>
          )}
        </div>
      ) : (
        quizGenerated && <p>No questions generated. Try a different input text.</p>
      )}
    </div>
  );
}
