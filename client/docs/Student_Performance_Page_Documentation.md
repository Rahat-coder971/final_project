# Student Performance Page Documentation

## Overview
The Student Performance Page (`/performance`) is the central dashboard for tracking a student's progress, skill development, and learning velocity. It aggregates data from:
- **Roadmap Milestones** (Completion status, quiz scores)
- **Daily Quizzes** (Streaks, daily scores)
- **AI Analytics** (Gemini-powered insights)
- **Mentor Feedback** (Manual reviews)

## Key Features & Components

### 1. Header Section
- **Student Name & Role**: Displays the student's name and current role (e.g., "Aspiring Developer").
- **Quick Stats**:
    - **Milestones**: Completed vs. Total milestones.
    - **Course Progress**: Overall percentage completion of the roadmap.

### 2. AI-Powered Analytics (New!)
This section uses **Google Gemini 1.5 Flash** to provide personalized, daily insights.
*   **Update Frequency**: Once per day (Cached for performance).
*   **Data Source**: Analyzes the last 7 days of test history and skill changes.

#### A. Learning Velocity Chart
-   **Visual**: A purple area chart showing the student's daily quiz scores over the last 7 days.
-   **Goal**: Visualize consistency and mastery trends.
-   **Features**:
    -   **Tooltip**: Hover to see exact score and date.
    -   **Empty State**: Shows "No data yet" if no quizzes are taken.
-   **Metric**: "Avg. Daily Score" is calculated from all-time daily quizzes.

#### B. Next Best Action
-   **Logic**: The AI identifies the single **most critical area** for improvement.
-   **New Users**: If no history exists, it selects the lowest current skill or recent test error.
-   **Existing Users**: Identifies declining trends or stagnant skills.
-   **Display**: Shows a clear title (e.g., "Focus on React Hooks") and a concise reason.

#### C. Weekly Impact
-   **Logic**: Compares current skill levels vs. a snapshot from ~7 days ago.
-   **Visual**:
    -   **Green Arrow Up**: Skill improved (e.g., "+12%").
    -   **Red Arrow Down**: Skill declined (e.g., "-5%").
    -   **Neutral/New**: Skills newly acquired or unchanged.

### 3. Milestone Progression
-   **Previous Milestone Card**:
    -   Shows grade, mentor feedback sentiemnt, and specific focus areas from the last completed milestone.
-   **Current Focus Card**:
    -   Highlights the active milestone and its locking status.

### 4. Daily Quiz & Streak
-   **Feature**: "Start Daily Quiz" button.
-   **Logic**:
    -   **Once Per Day**: Users can only generate one quiz per day. Subsequent attempts show the "Already Completed" screen.
    -   **Streak**: Tracks consecutive days of activity.
    -   **Dynamic Topics**: Questions are generated based on current active milestones + revision of past topics.

### 5. Coach's Insight (Sidebar)
-   **Feature**: An AI "Persona" that gives daily encouragement and strategic advice.
-   **Logic**:
    -   Generated via Gemini.
    -   Cached daily (only generates once per 24 hours).
    -   Context: Looks at recent interview scores and roadmap progress.

### 6. Job Readiness & Skills
-   **Job Readiness Score**: A radial gauge (0-100%) indicating preparedness for interviews.
-   **Skill Breakdown**: Detailed list of skills (e.g., React, Node.js) with progress bars based on quiz averages.

## Data Architecture

| Feature | Source Collection | Update Mechanism |
| :--- | :--- | :--- |
| **Daily Quizzes** | `DailyTest` | Real-time on submission |
| **Streaks** | `Student.streak` | Real-time on daily quiz |
| **Velocity Chart** | `DailyTest` | Calculated on page load |
| **Next Best Action** | `Student.analyticsInsight` | **Daily Batch (AI)** |
| **Weekly Impact** | `Student.analyticsInsight` | **Daily Batch (AI)** |
| **Coach Advice** | `Student.dailyInsight` | **Daily Batch (AI)** |

## Future Improvements
-   [ ] **Badges**: Award badges for streaks (7-day, 30-day).
-   [ ] **Peer Comparison**: Anonymous percentile ranking.
