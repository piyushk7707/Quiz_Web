import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function QuizPage({ quizId }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quiz/quizzes/${quizId}/`);
        setQuiz(response.data);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleAnswerSelect = (questionId, answerId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerId,
    });
  };

  if (!quiz) return <div>Loading...</div>;

  const question = quiz.questions[currentQuestion];

  return (
    <div className="quiz-page">
      <h1>{quiz.title}</h1>
      <div className="progress">
        Question {currentQuestion + 1} of {quiz.questions.length}
      </div>
      <div className="question">
        <h3>{question.text}</h3>
        <div className="answers">
          {question.answers.map((answer) => (
            <label key={answer.id}>
              <input
                type="radio"
                name={`question-${question.id}`}
                value={answer.id}
                checked={selectedAnswers[question.id] === answer.id}
                onChange={() => handleAnswerSelect(question.id, answer.id)}
              />
              {answer.text}
            </label>
          ))}
        </div>
      </div>
      <div className="navigation">
        <button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
        >
          Previous
        </button>
        {currentQuestion < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Next
          </button>
        ) : (
          <button onClick={() => window.location.href = '/dashboard'}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
