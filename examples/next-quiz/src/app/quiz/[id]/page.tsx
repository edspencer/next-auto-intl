'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { quizzes } from '@/data/quizData';

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const quizId = use(params).id;
  const quiz = quizzes.find((q) => q.id === quizId);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!quiz) {
    return <div className="text-center p-8">Quiz not found</div>;
  }

  const handleAnswer = (selectedAnswer: number) => {
    if (selectedAnswer === quiz.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < quiz.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Quiz Results</h2>
          <p className="text-xl text-center mb-6">
            You scored {score} out of {quiz.questions.length}!
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={restartQuiz}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
            <p className="text-gray-600">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
          <div className="mb-8">
            <h3 className="text-xl mb-4">{question.question}</h3>
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full p-4 text-left bg-gray-50 rounded hover:bg-gray-100"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
