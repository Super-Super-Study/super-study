'use client';

import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateQuiz} from '@/ai/flows/generate-quiz-from-text';
import {Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {Check, X} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {gradeOpenEndedQuestion} from '@/ai/flows/grade-open-ended-question';
import {generateOpenEndedQuestions} from '@/ai/flows/generate-open-ended-questions';
import {analyzeWeakAreas} from '@/ai/flows/analyze-weak-areas';

type MultipleChoiceQuestion = {
  type: 'multipleChoice';
  question: string;
  options: string[];
  answer: string;
  correctAnswerExplanation: string;
};

type OpenEndedQuestion = {
  type: string;
  question: string;
  idealAnswer: string;
};

type Question = MultipleChoiceQuestion | OpenEndedQuestion;

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [quiz, setQuiz] = useState<MultipleChoiceQuestion[]>([]);
  const [openEndedQuestions, setOpenEndedQuestions] = useState<OpenEndedQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [openEndedAnswers, setOpenEndedAnswers] = useState<string[]>([]);
  const [openEndedGrades, setOpenEndedGrades] = useState<number[]>([]);
  const [openEndedFeedback, setOpenEndedFeedback] = useState<string[]>([]);
  const [totalQuizScore, setTotalQuizScore] = useState(0);
  const [totalQuestionsScore, setTotalQuestionsScore] = useState(0);
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [openEndedQuestionsGenerated, setOpenEndedQuestionsGenerated] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [weakAreasAnalysis, setWeakAreasAnalysis] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleQuizGeneration = async () => {
  if (!inputText) {
    alert('Please enter text to generate a quiz.');
    return;
  }

  try {
    const generatedQuiz = await generateQuiz({text: inputText});
    setQuiz(
      generatedQuiz.quiz.map(q => ({
        ...q,
        type: 'multipleChoice',
      }))
    );
    setUserAnswers(Array(generatedQuiz.quiz.length).fill(''));

    const generatedOpenEndedQuestions = await generateOpenEndedQuestions({text: inputText});
    
    // Transform the open-ended questions to include the 'type' property
    const openEndedQuestionsWithType = generatedOpenEndedQuestions.questions.map(question => ({
      ...question,
      type: 'openEnded', // Adding the required 'type'
    }));

    setOpenEndedQuestions(openEndedQuestionsWithType);
    setOpenEndedAnswers(Array(generatedOpenEndedQuestions.questions.length).fill(''));
    setOpenEndedGrades(Array(generatedOpenEndedQuestions.questions.length).fill(0));
    setOpenEndedFeedback(Array(generatedOpenEndedQuestions.questions.length).fill(''));

    setTotalQuizScore(0);
    setTotalQuestionsScore(0);
    setQuizGenerated(true);
    setOpenEndedQuestionsGenerated(false);
    setShowFeedback(false);
    setTestEnded(false);
    setWeakAreasAnalysis(null);
  } catch (error) {
    console.error('Error generating quiz or open-ended questions:', error);
    alert('Failed to generate quiz or open-ended questions. Please try again.');
  }
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
    setTotalQuizScore(correctAnswers);
    setShowFeedback(true);
  };

  const handleResetQuiz = () => {
    setUserAnswers(Array(quiz.length).fill(''));
    setTotalQuizScore(0);
    setTotalQuestionsScore(0);
    setShowFeedback(false);
    setTestEnded(false);
    setWeakAreasAnalysis(null);
  };

  const handleOpenEndedAnswerChange = (index: number, answer: string): void => {
    const newAnswers = [...openEndedAnswers];
    newAnswers[index] = answer;
    setOpenEndedAnswers(newAnswers);
  };

  const handleGradeOpenEndedQuestions = async () => {
    const grades = [];
    const feedbacks = [];

    for (let i = 0; i < openEndedQuestions.length; i++) {
      if (!openEndedAnswers[i]) {
        grades.push(0);
        feedbacks.push('No answer provided.');
      } else {
        try {
          const result = await gradeOpenEndedQuestion({
            question: openEndedQuestions[i].question,
            answer: openEndedAnswers[i],
            idealAnswer: openEndedQuestions[i].idealAnswer,
          });

          // Ensure the grade is between 0 and 1
          const grade = Math.min(1, Math.max(0, result.grade));
          grades.push(grade);
          feedbacks.push(result.feedback);
        } catch (error) {
          console.error('Error grading open-ended question:', error);
          grades.push(0);
          feedbacks.push('Error grading question. Please try again.');
        }
      }
    }

    setOpenEndedGrades(grades);
    setOpenEndedFeedback(feedbacks);
    setOpenEndedQuestionsGenerated(true);
    setTotalQuestionsScore(grades.reduce((sum, grade) => sum + grade, 0));
  };

  const handleEndTest = async () => {
    handleSubmitQuiz();
    await handleGradeOpenEndedQuestions();
    setShowFeedback(true);
    setTestEnded(true);

    // Analyze weak areas
    try {
      const weakAreas = await analyzeWeakAreas({
        text: inputText,
        quiz: JSON.stringify(quiz),
        userAnswers: JSON.stringify(userAnswers),
        openEndedQuestions: JSON.stringify(openEndedQuestions),
        openEndedAnswers: JSON.stringify(openEndedAnswers),
        openEndedGrades: JSON.stringify(openEndedGrades),
      });
      setWeakAreasAnalysis(weakAreas.analysis);
    } catch (error) {
      console.error('Error analyzing weak areas:', error);
      setWeakAreasAnalysis('Failed to analyze weak areas. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-background"
    style={{ backgroundColor: '#EECC95'}}>
      <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
  Super Study
</h1>

      <Textarea
        placeholder="Enter text to generate a quiz"
        className="w-full max-w-2xl mb-4"
        value={inputText}
        onChange={handleInputChange}
        style = {{ backgroundColor: "#FFFFFF"}}
      />
      <Button
        onClick={handleQuizGeneration}
        className="mb-4 bg-[#A21E1E] text-primary-foreground"
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
                          ? 'bg-[#A21E1E] text-primary-foreground'
                          : ''
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
                      {showFeedback && userAnswers[questionIndex] === option &&
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
              className="bg-[#A21E1E] text-primary-foreground"
            >
              Submit Quiz
            </Button>
            <Button onClick={handleResetQuiz} variant="outline">
              Reset
            </Button>
          </div>

          {showFeedback && (
            <div className="mt-4 text-lg font-semibold">
              Your Quiz Score: {totalQuizScore} / {quiz.length}
            </div>
          )}
        </div>
      ) : (
        quizGenerated && (
          <p>No questions generated. Try a different input text.</p>
        )
      )}

      {openEndedQuestions.length > 0 ? (
        <div className="w-full max-w-2xl mt-8">
          <h2 className="text-2xl font-bold mb-4">Open-Ended Questions</h2>
          {openEndedQuestions.map((question, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your answer here"
                  className="w-full mb-2"
                  value={openEndedAnswers[index] || ''}
                  onChange={e => {
                    const newAnswers = [...openEndedAnswers];
                    newAnswers[index] = e.target.value;
                    setOpenEndedAnswers(newAnswers);
                  }}
                />
                {openEndedQuestionsGenerated && (
                  <div>
                    <p>Grade: {openEndedGrades[index]} / 1</p>
                    <p>Feedback: {openEndedFeedback[index]}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button onClick={handleGradeOpenEndedQuestions}>Grade Answers</Button>
          {openEndedQuestionsGenerated && (
            <div className="mt-4 text-lg font-semibold">
              Total Questions Score: {totalQuestionsScore} / {openEndedQuestions.length}
            </div>
          )}
        </div>
      ) : quizGenerated && (
        <p>No open-ended questions generated. Try a different input text.</p>
      )}

      {quizGenerated && (
        <Button onClick={handleEndTest} className="mt-4 bg-green-500 text-white">
          End Test
        </Button>
      )}

      {testEnded && showFeedback && (
        <div className="mt-4 text-lg font-semibold">
          Total Score: {totalQuizScore + totalQuestionsScore} / {quiz.length + openEndedQuestions.length}
          {weakAreasAnalysis && (
            <div className="mt-2">
              <strong>Weak Areas:</strong> {weakAreasAnalysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
