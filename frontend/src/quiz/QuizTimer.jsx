import React, { useState, useEffect } from 'react';

/**
 * QuizTimer Component
 * 
 * Countdown timer for individual quiz questions
 * - Resets for each new question via key prop
 * - Calls onTimeUp callback ONLY ONCE when timer reaches 0
 * - Cleans up all timers on unmount
 * - Cannot be paused or skipped
 * - Shows warning animation in last 5 seconds
 * 
 * Props:
 *   - duration: Timer duration in seconds (default: 30)
 *   - onTimeUp: Callback function when time expires (called once)
 *   - isActive: Whether timer should be counting down (default: true)
 */
const QuizTimer = ({ duration = 30, onTimeUp, isActive = true }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hasExpired, setHasExpired] = useState(false);

  // Timer effect - ensures single interval, proper cleanup
  useEffect(() => {
    if (!isActive || hasExpired) return;

    let timerInterval = null;
    let timeoutId = null;

    const startTimer = () => {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            // Mark as expired to prevent multiple calls
            setHasExpired(true);
            clearInterval(timerInterval);
            
            // Guarantee single callback execution
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            
            // Call onTimeUp after marking expired
            timeoutId = setTimeout(() => {
              onTimeUp();
            }, 0);
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    };

    startTimer();

    // Cleanup: clear both interval and timeout
    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, hasExpired, onTimeUp]);

  // Reset timer when duration changes (new question)
  useEffect(() => {
    setTimeLeft(duration);
    setHasExpired(false);
  }, [duration]);

  // Determine color based on time remaining
  const getTimerColor = () => {
    const percentage = (timeLeft / duration) * 100;
    if (percentage > 50) return '#4CAF50'; // Green
    if (percentage > 25) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  // Determine if time is running out (last 5 seconds)
  const isWarning = timeLeft <= 5 && timeLeft > 0;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="quiz-timer-container">
      <div className="timer-display">
        <svg className="timer-svg" width="120" height="120" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke={getTimerColor()}
            strokeWidth="3"
            strokeDasharray={`${(timeLeft / duration) * 345.575} 345.575`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dasharray 0.3s linear' }}
          />
          {/* Time text */}
          <text
            x="60"
            y="70"
            textAnchor="middle"
            fontSize="28"
            fontWeight="bold"
            fill={getTimerColor()}
            className={isWarning ? 'timer-warning' : isLowTime ? 'timer-pulse' : ''}
          >
            {timeLeft}
          </text>
          <text x="60" y="85" textAnchor="middle" fontSize="12" fill="#666">
            sec
          </text>
          {/* Time's Up indicator */}
          {timeLeft === 0 && (
            <text x="60" y="50" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#F44336">
              Time's Up
            </text>
          )}
        </svg>
      </div>
      <style jsx>{`
        .quiz-timer-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
        }

        .timer-display {
          position: relative;
        }

        .timer-svg {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes warning {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .timer-pulse {
          animation: pulse 0.5s infinite;
        }

        .timer-warning {
          animation: warning 0.4s infinite;
        }
      `}</style>
    </div>
  );
};

export default QuizTimer;
