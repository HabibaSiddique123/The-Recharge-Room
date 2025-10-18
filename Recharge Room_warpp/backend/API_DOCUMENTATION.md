# The Recharge Room API Documentation

## Overview

The Recharge Room is a comprehensive wellness application backend built with Flask. It provides REST APIs for task management, mood tracking, journaling, voice notes, and a gamified badge system.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-20T12:00:00Z",
    "is_active": true
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /auth/login
Authenticate a user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-20T12:00:00Z",
    "is_active": true
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /auth/logout
Logout the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logout successful",
  "user_id": "1"
}
```

### GET /auth/profile
Get current user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-20T12:00:00Z",
    "is_active": true,
    "task_stats": {
      "total_tasks": 15,
      "completed_tasks": 12,
      "current_streak": 3,
      "completion_rate": 80.0
    }
  }
}
```

---

## Task Management Endpoints

### GET /tasks/
Get all tasks for the current user.

**Query Parameters:**
- `status`: `completed`, `pending`, or omit for all
- `priority`: `low`, `medium`, `high`
- `limit`: Number of tasks to return

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "is_completed": false,
      "created_at": "2025-01-20T12:00:00Z",
      "completed_at": null,
      "updated_at": "2025-01-20T12:00:00Z",
      "priority": "high"
    }
  ],
  "count": 1
}
```

### POST /tasks/create
Create a new task.

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "priority": "high"
}
```

**Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "is_completed": false,
    "created_at": "2025-01-20T12:00:00Z",
    "completed_at": null,
    "updated_at": "2025-01-20T12:00:00Z",
    "priority": "high"
  }
}
```

### POST /tasks/complete/{task_id}
Mark a task as completed.

**Response (200):**
```json
{
  "message": "Task completed successfully",
  "task": {...},
  "stats": {
    "total_tasks": 15,
    "completed_tasks": 13,
    "current_streak": 4
  },
  "badges_unlocked": [
    {
      "id": 1,
      "name": "Task Warrior",
      "description": "Complete 10 tasks",
      "icon": "🏹",
      "type": "silver"
    }
  ],
  "confetti": true
}
```

### PUT /tasks/{task_id}
Update a task.

**Request Body:**
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "priority": "medium",
  "is_completed": true
}
```

### DELETE /tasks/{task_id}
Delete a task.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

### POST /tasks/clear
Clear all tasks for the user.

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (200):**
```json
{
  "message": "Successfully deleted 5 tasks",
  "deleted_count": 5
}
```

### GET /tasks/stats
Get task completion statistics.

**Response (200):**
```json
{
  "stats": {
    "total_tasks": 15,
    "completed_tasks": 12,
    "pending_tasks": 3,
    "completion_rate": 80.0,
    "current_streak": 3
  }
}
```

---

## Mood Tracking Endpoints

### POST /mood/add
Add a new mood entry.

**Request Body:**
```json
{
  "emoji": "😊",
  "label": "happy",
  "intensity": 8,
  "notes": "Had a great day at work!"
}
```

**Response (201):**
```json
{
  "message": "Mood saved successfully",
  "mood": {
    "id": 1,
    "user_id": 1,
    "emoji": "😊",
    "label": "happy",
    "intensity": 8,
    "notes": "Had a great day at work!",
    "created_at": "2025-01-20T12:00:00Z",
    "motivational_quote": "Keep shining! Your positive energy is contagious! ✨"
  },
  "motivational_quote": "Keep shining! Your positive energy is contagious! ✨"
}
```

### GET /mood/history
Get mood history for the user.

**Query Parameters:**
- `limit`: Number of moods to return (default: 50)
- `days`: Filter moods from last N days

**Response (200):**
```json
{
  "moods": [
    {
      "id": 1,
      "user_id": 1,
      "emoji": "😊",
      "label": "happy",
      "intensity": 8,
      "notes": "Had a great day at work!",
      "created_at": "2025-01-20T12:00:00Z",
      "motivational_quote": "Keep shining! Your positive energy is contagious! ✨"
    }
  ],
  "count": 1
}
```

### GET /mood/export
Export mood history as CSV file.

**Response (200):**
Returns CSV file with headers: Date, Time, Emoji, Label, Intensity, Notes

### GET /mood/stats
Get mood statistics for visualization.

**Query Parameters:**
- `days`: Number of days to analyze (default: 30)

**Response (200):**
```json
{
  "stats": {
    "mood_counts": {
      "happy": 10,
      "excited": 5,
      "calm": 8
    },
    "total_entries": 23,
    "average_intensity": 7.2,
    "period_days": 30
  }
}
```

### GET /mood/graph
Get mood data for graph visualization.

**Response (200):**
```json
{
  "graph_data": {
    "mood_distribution": {
      "happy": 10,
      "excited": 5,
      "calm": 8
    },
    "recent_trends": [...],
    "total_entries": 23,
    "average_intensity": 7.2,
    "period_days": 30
  }
}
```

---

## Journal Endpoints

### POST /journal/add
Create a new journal entry.

**Request Body:**
```json
{
  "title": "My Thoughts Today",
  "content": "Today was a wonderful day. I accomplished so much and felt really productive.",
  "theme": "plain",
  "mood_tag": "happy",
  "is_private": true
}
```

**Response (201):**
```json
{
  "message": "Journal entry created successfully",
  "journal": {
    "id": 1,
    "user_id": 1,
    "title": "My Thoughts Today",
    "content": "Today was a wonderful day...",
    "theme": "plain",
    "mood_tag": "happy",
    "is_private": true,
    "created_at": "2025-01-20T12:00:00Z",
    "updated_at": "2025-01-20T12:00:00Z",
    "word_count": 15
  }
}
```

### GET /journal/
Get all journal entries for the user.

**Query Parameters:**
- `limit`: Number of entries to return
- `theme`: Filter by theme
- `mood_tag`: Filter by mood tag

**Response (200):**
```json
{
  "entries": [
    {
      "id": 1,
      "user_id": 1,
      "title": "My Thoughts Today",
      "content": "Today was a wonderful day...",
      "theme": "plain",
      "mood_tag": "happy",
      "is_private": true,
      "created_at": "2025-01-20T12:00:00Z",
      "updated_at": "2025-01-20T12:00:00Z",
      "word_count": 15
    }
  ],
  "count": 1
}
```

### GET /journal/{entry_id}
Get a specific journal entry.

### PUT /journal/{entry_id}
Update a journal entry.

### DELETE /journal/{entry_id}
Delete a journal entry.

### GET /journal/themes
Get available journal themes.

**Response (200):**
```json
{
  "themes": ["plain", "lined", "dark", "minimal", "colorful"]
}
```

### GET /journal/stats
Get journal statistics.

**Response (200):**
```json
{
  "stats": {
    "total_entries": 25,
    "total_words": 5420,
    "average_words_per_entry": 216.8,
    "themes_used": ["plain", "dark", "lined"],
    "most_recent_entry": {...},
    "longest_entry": {...}
  }
}
```

---

## Voice Notes Endpoints

### POST /voice/save
Save a transcribed voice note.

**Request Body:**
```json
{
  "title": "Meeting Notes",
  "transcription": "Today's meeting went well. We discussed the project timeline and deliverables.",
  "duration_seconds": 120,
  "language": "en",
  "confidence_score": 0.95,
  "tags": ["meeting", "work", "project"]
}
```

**Response (201):**
```json
{
  "message": "Voice note saved successfully",
  "voice_note": {
    "id": 1,
    "user_id": 1,
    "title": "Meeting Notes",
    "transcription": "Today's meeting went well...",
    "duration_seconds": 120,
    "language": "en",
    "confidence_score": 0.95,
    "tags": ["meeting", "work", "project"],
    "created_at": "2025-01-20T12:00:00Z",
    "word_count": 15,
    "excerpt": "Today's meeting went well. We discussed the project..."
  }
}
```

### GET /voice/
Get all voice notes for the user.

**Query Parameters:**
- `limit`: Number of notes to return
- `language`: Filter by language
- `tag`: Filter by tag

### GET /voice/{note_id}
Get a specific voice note.

### PUT /voice/{note_id}
Update a voice note.

### DELETE /voice/{note_id}
Delete a voice note.

### GET /voice/export-transcriptions
Export all transcriptions as plain text.

**Response (200):**
```json
{
  "export_data": "Voice Notes Transcriptions Export\n======================\n...",
  "total_notes": 5,
  "filename": "voice_notes_transcriptions.txt"
}
```

---

## Rewards/Badges Endpoints

### GET /rewards/list
Get all rewards (badges) for the user - both unlocked and locked.

**Response (200):**
```json
{
  "unlocked_badges": [
    {
      "id": 1,
      "name": "First Step",
      "description": "Complete your first task",
      "icon": "🎯",
      "category": "task",
      "type": "bronze",
      "condition_type": "count",
      "condition_value": 1,
      "points": 10,
      "status": "unlocked",
      "earned_at": "2025-01-20T12:00:00Z",
      "is_featured": false
    }
  ],
  "locked_badges": [...],
  "total_unlocked": 5,
  "total_locked": 15,
  "total_badges": 20
}
```

### GET /rewards/unlocked
Get only unlocked badges for the user.

### GET /rewards/stats
Get badge statistics for the user.

**Response (200):**
```json
{
  "stats": {
    "total_badges": 5,
    "total_points": 150,
    "categories": {
      "task": 3,
      "mood": 1,
      "streak": 1
    },
    "badge_types": {
      "bronze": 3,
      "silver": 2
    },
    "recent_badges": [...]
  }
}
```

### POST /rewards/feature/{badge_id}
Toggle featured status of a user badge.

### GET /rewards/categories
Get all badge categories with their counts.

### GET /rewards/category/{category}
Get badges in a specific category with user progress.

---

## Dashboard Endpoints

### GET /dashboard/
Get comprehensive dashboard summary.

**Response (200):**
```json
{
  "dashboard": {
    "user_info": {...},
    "task_summary": {
      "total_tasks": 15,
      "completed_tasks": 12,
      "pending_tasks": 3,
      "completion_rate": 80.0,
      "current_streak": 3
    },
    "recent_moods": [...],
    "recent_journal_entries": [...],
    "recent_voice_notes": [...],
    "unlocked_rewards": [...],
    "badge_summary": {
      "total_badges": 5,
      "total_points": 150,
      "categories": {...}
    }
  }
}
```

### GET /dashboard/quick-stats
Get quick statistics for dashboard cards.

**Response (200):**
```json
{
  "quick_stats": {
    "totals": {
      "tasks": 15,
      "completed_tasks": 12,
      "moods": 25,
      "journal_entries": 10,
      "voice_notes": 8,
      "badges": 5
    },
    "today": {
      "tasks_completed": 2,
      "moods_logged": 1,
      "journal_entries": 0
    },
    "streaks": {
      "current_task_streak": 3
    },
    "completion_rate": 80.0
  }
}
```

### GET /dashboard/activity-feed
Get recent activity across all modules.

**Query Parameters:**
- `limit`: Number of activities to return (default: 20)
- `days`: Number of days to look back (default: 7)

### GET /dashboard/weekly-summary
Get weekly summary statistics.

### GET /dashboard/motivation
Get daily motivational content based on user's recent activity.

### GET /dashboard/insights
Get personalized insights based on user data.

---

## Health Check

### GET /health
Check API health status.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "The Recharge Room API"
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error message"
}
```

---

## Frontend Integration

### Button → Backend Action Mapping

| Frontend Action | Backend Endpoint | Description |
|----------------|------------------|-------------|
| Login button | `POST /auth/login` | Authenticate user, set token, send notification |
| Signup button | `POST /auth/signup` | Create new user, redirect to dashboard |
| Add Task button | `POST /tasks/create` | Create new task |
| Task Checkbox click | `PUT /tasks/{id}` | Mark completed, unlock badges |
| Clear Tasks button | `POST /tasks/clear` | Delete all user tasks |
| Select Mood button | `POST /mood/add` | Save mood, return motivational quote |
| Export Mood button | `GET /mood/export` | Download CSV file |
| Save Journal button | `POST /journal/add` | Save entry with theme |
| Delete Journal button | `DELETE /journal/{id}` | Remove entry |
| Start Voice Recording | `POST /voice/save` | Store transcription text |
| Delete Voice Note | `DELETE /voice/{id}` | Remove voice note |
| Rewards page | `GET /rewards/list` | Fetch all badges |

---

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
FLASK_ENV=development

# Database Configuration
DATABASE_URL=sqlite:///recharge_room.db

# Email Configuration (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@rechargeroom.com

# Server Configuration
PORT=5000
```

---

## Installation and Setup

1. **Create Virtual Environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set Environment Variables:**
Create a `.env` file with the variables above.

4. **Initialize Database:**
```bash
python run.py
```

The database tables and default badges will be created automatically on first run.

5. **Run Development Server:**
```bash
python run.py
```

The API will be available at `http://localhost:5000`

---

## Production Deployment

For production deployment, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## Testing

The API can be tested using tools like:
- **Postman** - Import the endpoints and test manually
- **curl** - Command line testing
- **Python requests** - Automated testing

Example curl command:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

This completes the comprehensive API documentation for The Recharge Room backend. The API is designed to work seamlessly with your existing React frontend without requiring any UI changes.