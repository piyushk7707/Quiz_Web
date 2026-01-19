/**
 * REACT QUIZ INTERFACE - IMPLEMENTATION GUIDE
 * 
 * This document outlines the complete React.js quiz interface implementation
 * integrated with Django REST API backend
 */

// ============================================================================
// FOLDER STRUCTURE
// ============================================================================

frontend/src/
├── quiz/
│   ├── QuizStart.jsx      // Difficulty selection & test initialization
│   ├── QuizQuestion.jsx   // Main quiz interface (one question at a time)
│   ├── QuizTimer.jsx      // Per-question countdown timer component
│   └── QuizResult.jsx     // Results display & score summary
├── auth/
│   ├── Login.js
│   └── Register.js
├── dashboard/
│   └── Dashboard.js       // Updated with quiz link
├── routes/
│   └── ProtectedRoute.js  // Enhanced JWT protection
├── context/
│   └── AuthContext.js     // User authentication context
├── api/
│   └── client.js          // Axios with JWT headers
├── App.js                 // Updated routing
└── index.js

// ============================================================================
// COMPONENT: QuizTimer.jsx
// ============================================================================

/**
 * Per-question countdown timer with automatic reset
 * 
 * Features:
 * - 30-second countdown per question
 * - Circular SVG progress indicator
 * - Color gradient: Green (>50%) → Yellow (>25%) → Red (≤25%)
 * - Pulse animation for low time warning
 * - Automatic reset on new question (via key prop)
 * - Callback on time expiry
 * 
 * Props:
 *   - duration: number (default: 30)
 *   - onTimeUp: function (called when timer reaches 0)
 *   - isActive: boolean (controls timer pause/resume)
 * 
 * Usage:
 *   <QuizTimer
 *     key={timerKey}           // Change to reset timer
 *     duration={30}
 *     onTimeUp={handleTimeUp}
 *     isActive={!isAnswered}
 *   />
 */

// ============================================================================
// COMPONENT: QuizStart.jsx
// ============================================================================

/**
 * Initial quiz screen - difficulty selection
 * 
 * Features:
 * - Three difficulty cards (Easy, Medium, Hard)
 * - Displays points per question (2/4/6)
 * - Shows test info (15 questions, 30 sec per question, auto-advance)
 * - API call to backend /quiz/start/ with difficulty
 * - Redirects to QuizQuestion page with test ID
 * - Error handling & loading states
 * 
 * Flow:
 * 1. User selects difficulty
 * 2. POST to /quiz/start/ with difficulty
 * 3. Receive test with 15 random questions
 * 4. Navigate to /quiz/test/{testId}
 * 
 * State:
 * - selectedDifficulty: Current selection
 * - isLoading: API call in progress
 * - error: Error message display
 */

// ============================================================================
// COMPONENT: QuizQuestion.jsx
// ============================================================================

/**
 * Main quiz interface - shows one question at a time
 * 
 * CRITICAL FEATURES:
 * 
 * 1. TIMER LOGIC
 *    - 30-second timer per question (never paused)
 *    - Timer RESETS for each new question
 *    - On expiry: Auto-submit as unanswered, advance to next
 *    - Uses key prop (timerKey) to force React re-mount
 * 
 * 2. ANSWER SUBMISSION
 *    - Click option → Lock question → Submit to backend
 *    - POST /quiz/test/{testId}/answer/
 *    - Auto-advance after 800ms delay
 *    - No manual answer changing allowed
 * 
 * 3. QUESTION FLOW
 *    - Displays: Question N of 15
 *    - Shows difficulty badge (Easy/Medium/Hard)
 *    - 4 clickable option buttons with letters (A-D)
 *    - Progress bar at top
 *    - Disabled after selection
 * 
 * 4. COMPLETION
 *    - Last question → Auto POST to /quiz/test/{testId}/complete/
 *    - Include time_taken_seconds
 *    - Redirect to /quiz/results/{testId}
 * 
 * State Management:
 * - currentQuestionIndex: 0-14
 * - selectedOption: null | optionId
 * - isAnswered: boolean (locks UI)
 * - timerKey: incremented to reset timer
 * - isSubmittingAnswer: prevents duplicate submissions
 * 
 * Hooks:
 * - useParams(): Get testId from URL
 * - useNavigate(): Redirect to results
 * - useCallback(): Memoized handlers for timer
 * - useEffect(): Fetch test data on mount
 */

// ============================================================================
// COMPONENT: QuizResult.jsx
// ============================================================================

/**
 * Results page shown after test completion
 * 
 * Features:
 * - Performance rating with emoji (Excellent/Very Good/Good/Satisfactory/Pass/Needs Improvement)
 * - Score breakdown cards:
 *   - Total Score
 *   - Max Score
 *   - Percentage
 *   - Reward Points
 * - Percentage progress bar
 * - Statistics grid:
 *   - Total/Correct/Incorrect/Unanswered counts
 *   - Difficulty level
 *   - Points per question
 * - Action buttons:
 *   - Start New Test → /quiz
 *   - Go to Dashboard → /dashboard
 * - Test metadata (ID, completion timestamp)
 * 
 * API:
 * - GET /quiz/test/{testId}/results/
 * - Returns full result with score_summary and responses
 * 
 * Display Only:
 * - No full question list shown
 * - Summary metrics only
 */

// ============================================================================
// API ENDPOINTS USED
// ============================================================================

/**
 * POST /quiz/start/
 * Body: { "difficulty": "easy|medium|hard" }
 * Response: { id, difficulty, total_questions, started_at, questions: [] }
 * 
 * GET /quiz/test/{testId}/
 * Response: { id, questions: [{ id, text, difficulty, options: [] }] }
 * 
 * POST /quiz/test/{testId}/answer/
 * Body: { "question_id": 1, "option_id": 4 }
 * OR: { "question_id": 1, "option_id": null }  // Unanswered
 * Response: { is_correct, message }
 * 
 * POST /quiz/test/{testId}/complete/
 * Body: { "time_taken_seconds": 1200 }
 * Response: Full result with score_summary
 * 
 * GET /quiz/test/{testId}/results/
 * Response: Full test results with all responses
 * 
 * GET /quiz/history/
 * Response: Array of completed tests
 */

// ============================================================================
// TIMER RESET MECHANISM
// ============================================================================

/**
 * CRITICAL: How timer resets for each question
 * 
 * Method: React key prop forces component re-mount
 * 
 * In QuizQuestion.jsx:
 * 
 * const [timerKey, setTimerKey] = useState(0);
 * 
 * // When moving to next question:
 * const handleNextQuestion = useCallback(async () => {
 *   if (isLastQuestion) {
 *     // Complete test...
 *   } else {
 *     setCurrentQuestionIndex((prev) => prev + 1);
 *     setSelectedOption(null);
 *     setIsAnswered(false);
 *     setTimerKey((prev) => prev + 1);  // <- KEY CHANGE!
 *   }
 * }, [...]);
 * 
 * // In render:
 * <QuizTimer
 *   key={timerKey}  // <- Forces complete re-mount and reset
 *   duration={30}
 *   onTimeUp={handleTimeUp}
 *   isActive={!isAnswered}
 * />
 * 
 * Why this works:
 * 1. Key changes → React unmounts old timer
 * 2. React mounts new timer → useState resets to duration
 * 3. New useEffect starts counting from 30 again
 * 4. Clean: No stale timers or intervals
 */

// ============================================================================
// AUTHENTICATION & PROTECTION
// ============================================================================

/**
 * ProtectedRoute.jsx
 * - Wraps quiz routes
 * - Checks for JWT token in localStorage
 * - Checks for user in AuthContext
 * - Redirects to /login if not authenticated
 * - Shows loading state while checking
 * 
 * App.js Routing:
 * <Route path="/quiz" element={<ProtectedRoute><QuizStart /></ProtectedRoute>} />
 * <Route path="/quiz/test/:testId" element={<ProtectedRoute><QuizQuestion /></ProtectedRoute>} />
 * <Route path="/quiz/results/:testId" element={<ProtectedRoute><QuizResult /></ProtectedRoute>} />
 * 
 * All quiz endpoints automatically include JWT via axios interceptor:
 * - api.interceptors.request.use() adds Authorization header
 * - Token refreshed automatically on 401
 */

// ============================================================================
// USER FLOW (END-TO-END)
// ============================================================================

/**
 * 1. USER LOGS IN
 *    - POST /auth/login/ with email/password
 *    - Receive JWT tokens (access + refresh)
 *    - Stored in localStorage
 *    - Redirected to /dashboard
 * 
 * 2. CLICKS "START QUIZ"
 *    - Navigated to /quiz (QuizStart)
 *    - Shows three difficulty options
 * 
 * 3. SELECTS DIFFICULTY
 *    - POST /quiz/start/ with difficulty
 *    - Test created, 15 random questions selected
 *    - Redirected to /quiz/test/{testId}
 * 
 * 4. QUIZ STARTS (QuizQuestion)
 *    - GET /quiz/test/{testId}/ to fetch questions
 *    - Display Question 1 of 15
 *    - 30-second timer starts
 * 
 * 5. FOR EACH QUESTION
 *    a. User has 30 seconds to select answer
 *    b. User clicks option → Locked
 *    c. POST /quiz/test/{testId}/answer/ submitted
 *    d. After 800ms → Next question OR
 *    d. Timer expires → Auto POST with null (unanswered)
 *    e. Timer resets → Question N+1
 * 
 * 6. LAST QUESTION COMPLETED
 *    - POST /quiz/test/{testId}/complete/
 *    - Backend calculates score (difficulty-based points)
 *    - Redirected to /quiz/results/{testId}
 * 
 * 7. RESULTS PAGE (QuizResult)
 *    - GET /quiz/test/{testId}/results/
 *    - Shows score summary (total/max/percentage/earned)
 *    - Shows performance rating
 *    - Options: Start new test or go to dashboard
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Network Errors:
 * - Axios auto-retries on 401 (token refresh)
 * - User-facing error messages for failed API calls
 * - Loading states prevent duplicate submissions
 * - Graceful fallback if timer submission fails
 * 
 * User Experience:
 * - isSubmittingAnswer flag prevents rapid clicks
 * - isAnswered flag locks UI after selection
 * - useCallback dependencies prevent stale closures
 * - Timer continues even if submission fails
 */

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * 1. useCallback: Memoized handlers prevent recreation
 * 2. Dependency arrays: Prevent unnecessary re-renders
 * 3. Key prop on timer: Forces clean component unmount/mount
 * 4. Conditional rendering: Loading/error states
 * 5. CSS-in-JS with styled-jsx: Scoped styles, no conflicts
 * 6. No Redux: Simpler state management (useState only)
 * 7. Lazy loading: Routes with React.lazy() could be added
 */

// ============================================================================
// NO PAUSE FUNCTIONALITY
// ============================================================================

/**
 * INTENTIONALLY RESTRICTED:
 * - No pause button
 * - No skip button
 * - Timer runs continuously
 * - isActive={!isAnswered} prevents timer pause
 * - Must answer or wait for timeout
 * 
 * Design rationale:
 * - Prevents cheating (looking up answers)
 * - Ensures fair test conditions
 * - Simulates real exam experience
 */

// ============================================================================
// STYLING APPROACH
// ============================================================================

/**
 * - Styled JSX (Next.js style CSS-in-JS)
 * - No external CSS libraries
 * - No Tailwind CSS
 * - Responsive design with media queries
 * - Color scheme: Purple gradient (#667eea, #764ba2)
 * - Accessibility: Proper contrast, semantic HTML
 * - Mobile-first design
 * 
 * CSS Features:
 * - CSS Grid for layouts
 * - Flexbox for alignment
 * - CSS animations for timer pulse
 * - Box shadows for depth
 * - Smooth transitions (0.3s ease)
 */

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/**
 * [ ] Timer resets correctly on each question
 * [ ] Timer reaches 0 → Auto-submit as unanswered
 * [ ] Cannot change answer after clicking option
 * [ ] Cannot skip questions manually
 * [ ] Cannot pause test
 * [ ] Selecting option → API submit works
 * [ ] On last question → Complete test API called
 * [ ] Results page shows correct score summary
 * [ ] Unauthenticated users redirected to login
 * [ ] JWT token automatically refreshed on 401
 * [ ] All buttons work on mobile
 * [ ] Timer updates visible on slow connections
 * [ ] No console errors
 */

export default "React Quiz Interface Implementation Guide";
