<p align="center">
  <a href="https://aossie.org">
    <img src="https://aossie.org/logo1.png" alt="AOSSIE Logo" width="200"/>
  </a>
</p>

<h1 align="center">EduAid: AI Quiz Generation 🚀</h1>

<p align="center">
  <a href="https://discord.gg/hjUhu33uAn">
    <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/>
  </a>
  <a href="https://x.com/aossie_org">
    <img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="X"/>
  </a>
  <a href="https://www.youtube.com/@AOSSIE-Org">
    <img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube"/>
  </a>
</p>

Online learning has taken the front seat in the post-pandemic age. With the advent of sophisticated AI architectures like Transformers, it is only natural that AI would find its way into education. Learning online via platforms like YouTube or MOOCs is often a method of self-learning. The biggest obstacle faced by students in self-learning is the lack of attention span. An online tool that can generate short quizzes from input educational content can be a great resource for both teachers and students. It helps retain important information, frame questions, and quickly revise large chunks of content.

EduAid is one such project currently available in the form of a browser extension.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AOSSIE-Org/EduAid.git
cd EduAid
```

## 2. Backend Setup

You have three options to set up the backend: **Docker Compose (Recommended)**, **Manual Setup with Celery**, or **Legacy Mode**.

### Option 1: Docker Compose Setup (Recommended) 🐳

This is the easiest and most memory-efficient way to run EduAid backend.


2. **Install Python Dependencies**:
   - Navigate to the root repository folder and run the following command to install the required Python dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - The `llama-cpp-python` package will be installed for LLM-based question generation. It will automatically download the Qwen3-0.6B model (~397MB) on first use.
1. **Prerequisites**:
   - Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

2. **Start All Services**:

   ```bash
   cd EduAid
   docker-compose up
   ```

   This will automatically:
   - Start Redis for task queue management
   - Start Celery worker for ML inference (models loaded here)
   - Start Flask backend server (lightweight, no models loaded)

3. **Access the Backend**:
   - Backend API: `http://localhost:5000`
   - All endpoints work the same as before!

4. **Stop Services**:
   ```bash
   docker-compose down
   ```

**Benefits**:

- ✅ No manual Redis/Celery setup required
- ✅ Memory-efficient (models loaded only in worker)
- ✅ Easy to start/stop everything
- ✅ Consistent environment across machines

---

### Option 2: Manual Setup with Celery (Memory-Efficient)

For local development without Docker.

1. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt')"
   ```

2. **Download Sense2Vec Model**:

   ```bash
   cd backend
   wget https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz
   tar -xzf s2v_reddit_2015_md.tar.gz
   rm s2v_reddit_2015_md.tar.gz
   ```

3. **Configure Environment**:

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and set: USE_CELERY_INFERENCE=true
   ```

4. **Start Redis** (in terminal 1):

   ```bash
   # Using Docker:
   docker run -d -p 6379:6379 redis:7-alpine

   # Or install Redis locally and run:
   redis-server
   ```

5. **Start Celery Worker** (in terminal 2):

   ```bash
   cd backend
   celery -A celery_worker.celery_app worker --loglevel=info
   ```

6. **Start Flask Server** (in terminal 3):
   ```bash
   cd backend
   python server.py
   ```

**Benefits**:

- ✅ Memory-efficient (~4-6GB RAM instead of ~8-10GB)
- ✅ Models loaded only once in Celery worker
- ✅ Flask server stays lightweight

---

### Option 3: Legacy Mode (Simple but Memory-Heavy)

For quick testing without Redis/Celery setup.

1. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt')"
   ```

2. **Download Sense2Vec Model**:

   ```bash
   cd backend
   wget https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz
   tar -xzf s2v_reddit_2015_md.tar.gz
   rm s2v_reddit_2015_md.tar.gz
   ```

3. **Configure Environment**:

   ```bash
   cd backend
   cp .env.example .env
   # Keep default: USE_CELERY_INFERENCE=false
   ```

4. **Start Flask Server**:
   ```bash
   cd backend
   python server.py
   ```

**Note**: This mode loads all ML models directly in Flask, using ~8-10GB RAM.

---

### Quick Start Scripts

For convenience, use the provided startup scripts:

**Linux/Mac**:

```bash
cd backend
chmod +x start-dev.sh
./start-dev.sh
```

**Windows**:

```bash
cd backend
start-dev.bat
```

These scripts will:

- Check your configuration
- Verify Redis/Celery if needed
- Start the Flask server

---

### Troubleshooting

<<<<<<< HEAD
- If the script fails to run, ensure that you have execution permissions:
  ```bash
  chmod +x script.sh
  ```

### LLM-Based Question Generation

The backend now includes support for AI-powered short-answer question generation using Qwen3-0.6B:

- **Model**: Qwen3-0.6B (Q4_K_M quantization, ~397MB)
- **Endpoint**: POST `/get_shortq_llm`
- **Features**:
  - Lazy loading: Model downloads on first request
  - Fast inference: ~2-3 seconds on CPU
  - Configurable question count
  - Automatic context length management
  - Robust JSON and fallback parsing
- **Request Parameters**:
  ```json
  {
    "input_text": "Your text content here",
    "max_questions": 4,
    "use_mediawiki": 0
  }
  ```
=======
**Issue**: "Celery is not available" error

- **Solution**: Make sure Redis and Celery worker are running, or set `USE_CELERY_INFERENCE=false` in `.env`

**Issue**: "Async endpoints are disabled" error

- **Solution**: Set `USE_ASYNC=true` in `.env` to enable async endpoints (requires Celery)
- **Note**: Sync endpoints (`/get_mcq`, `/get_boolq`, etc.) always work

**Issue**: High memory usage

- **Solution**: Use Docker Compose or Manual Setup with Celery (Option 1 or 2)

**Issue**: Redis connection failed

- **Solution**: Check if Redis is running on port 6379: `redis-cli ping` should return `PONG`

---

### Async vs Sync Endpoints

EduAid provides two types of endpoints:

**Sync Endpoints** (Always Available):

- `/get_mcq` - Returns results immediately
- `/get_boolq` - Returns results immediately
- `/get_shortq` - Returns results immediately
- `/get_problems` - Returns results immediately

**Async Endpoints** (Opt-in via `USE_ASYNC=true`):

- `/generate_mcq_async` - Returns task_id, poll for results
- `/generate_boolq_async` - Returns task_id, poll for results
- `/generate_shortq_async` - Returns task_id, poll for results
- `/generate_all_async` - Returns task_id, poll for results
- `/task_status/<task_id>` - Check task status
- `/task_result/<task_id>` - Get task results

**When to use async endpoints:**

- Frontend supports polling for results
- Need to handle long-running requests
- Want to prevent timeout issues
- Building a queue-based system

**When to use sync endpoints:**

- Simple request-response pattern
- Frontend expects immediate results
- Easier to implement (no polling needed)

---
>>>>>>> 8b154d5 (improve async pipeline with memory optimization, docker setup, and safe rollout toggle)

### 3. Configure Google APIs

#### Google Docs API

1. Navigate to the `backend` folder.
2. Open the `service_account_key.json` file.
3. Enter the service account details for the Google Docs API.
4. Refer to the [Google Docs API documentation](https://developers.google.com/docs/api/reference/rest) for more details.

#### Google Forms API

1. Open the `credentials.json` file in the `backend` folder.
2. Enter the necessary credentials for the Google Forms API.
3. Refer to the [Google Forms API quickstart guide](https://developers.google.com/forms/api/quickstart/python#set_up_your_environment) for setup instructions.

### 4. Extension Setup

#### Install Dependencies

Navigate to the `extension` folder and install the required dependencies:

```bash
npm install
```

#### Build the Project

Build the extension:

```bash
npm run build
```

#### Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" (top-right corner).
3. Click on "Load Unpacked" and select the `dist` folder created in the previous step.

#### EduAid Web App

In addition to the browser extension, EduAid also offers a web app that provides the same powerful features for quiz generation. The web app allows you to access EduAid's capabilities directly from your browser without needing to install any extensions. Just start the backend server locally and:

1. Navigate to the Web App Directory:
   `cd eduaid_web`
2. Install Dependencies:
   `npm install`
3. Start the Web App:
   `npm run start`

### 5. Desktop App Setup

EduAid now includes a cross-platform desktop application built with Electron, providing a native desktop experience for all EduAid features.

#### Prerequisites

- Node.js (version 16 or higher)
- Backend server running (follow steps 2-3 above)
- Web app built (follow step 4 above)

#### Development Mode

1. **Navigate to Desktop App Directory**:

   ```bash
   cd eduaid_desktop
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Start Development Mode**:
   ```bash
   npm run dev
   ```
   This will start both the web app development server and launch the Electron desktop app.

#### Production Build

1. **Build Web App** (if not already done):

   ```bash
   cd eduaid_web
   npm run build
   ```

2. **Build Desktop App**:

   ```bash
   cd eduaid_desktop
   npm run build:electron
   ```

3. **Build for All Platforms**:
   ```bash
   npm run build:all
   ```

The built applications will be available in the `eduaid_desktop/dist/` directory with installers for Windows (.exe), macOS (.dmg), and Linux (.AppImage).

#### Desktop App Features

- **Native Desktop Experience**: Full desktop integration with native menus and keyboard shortcuts
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Security**: Secure communication with context isolation
- **Auto-Updates**: Built-in support for automatic updates

## Features

1. **Dynamic Question Generation**:
   - **Boolean Questions**: Quickly generate engaging true/false questions.
   - **Multiple-Choice Questions (MCQ)**: Create diverse MCQs with up to 4 options for comprehensive quizzes.
   - **Single Correct Answer Questions**: Formulate questions with one clear correct answer.
   - **LLM-Based Short-Answer Questions**: Generate questions using Qwen3-0.6B model for AI-powered short-answer generation.
   - **Customizable Question Count**: Tailor the number of questions to your needs—just select the type, set the number, and hit "Generate" to see your quiz come to life!

2. **Quiz History at Your Fingertips**:
   - **Last 5 Quizzes**: Instantly access and review the last 5 quizzes you've generated. No more losing track—your quiz history is always just a click away!

3. **Smart Answer Generator**:
   - **Automatic Answers**: Seamlessly generate answers for various question types. Toggle the switch on the Get Started page to enable or disable this feature.
   - **MCQ Answer Magic**: For MCQs, provide the options and let the tool generate the perfect answers for you.

4. **Wiki-Based Quiz Generation**:
   - **Topic-Based Quizzes**: Missing text content for a topic? Toggle the switch in the bottom right corner of the Question Generator page to create a quiz based on the topic using external knowledge sources.

5. **Flexible Quiz Input**:
   - **File Parsing**: Upload `.txt`, `.docx`, or `.pdf` files to easily extract content for quiz creation.
   - **Google Docs Integration**: Use the open shareable link from Google Docs to generate quizzes directly from your documents.

6. **Enhanced Quiz Visibility**:
   - **SidePanel View**: Enjoy an organized and enhanced view of your generated quizzes right in the SidePanel.

7. **Editable Forms**:
   - **PDF Forms**: Generate editable PDF forms based on your quizzes.
   - **Google Forms**: Create Google Forms for your quizzes, perfect for easy distribution and response collection.

## How to contribute

This is the second year of the project. While some may have their own ideas on how to contribute, for the newcomers to the repository, you may follow the following steps:

1. First get to know the organization and the project by visiting the [Official Website](https://github.com/AOSSIE-Org)

2. Visit the [Discord Channel](https://discord.com/channels/1022871757289422898/1073262393670504589) for interacting with the community!

3. Subscribe to our [YouTube Channel](https://www.youtube.com/@AOSSIE-Org) for project demos, GSoC tutorials, and updates!

4. Follow us on [X (formerly Twitter)](https://x.com/aossie_org) for the latest open-source announcements!
