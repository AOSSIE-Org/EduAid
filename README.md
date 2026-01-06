# EduAid: AI Quiz Generation 🚀

Online learning has taken the front seat in the post-pandemic age. With the advent of sophisticated AI architectures like Transformers, it is only natural that AI would find its way into education. Learning online via platforms like YouTube or MOOCs is often a method of self-learning. The biggest obstacle faced by students in self-learning is the lack of attention span. An online tool that can generate short quizzes from input educational content can be a great resource for both teachers and students. It helps retain important information, frame questions, and quickly revise large chunks of content.

EduAid is one such project currently available in the form of a browser extension.

## Project Structure

EduAid is a multi-component project consisting of:

- `backend/` – Flask backend API and NLP models (Sense2Vec-based)
- `extension/` – Browser extension frontend
- `eduaid_web/` – Web application frontend
- `eduaid_desktop/` – Electron-based desktop application
- `scripts/` – Helper shell scripts for setup and automation

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm
- Git

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AOSSIE-Org/EduAid.git
cd EduAid
```
## 2. Backend Setup

The backend service and its related files are located in the `backend/` directory. Follow the steps below to set up the backend. Commands that operate on the backend should be run from inside `backend/`.

### Option 1: Manual Setup

1. **Download the Sense2Vec Model**:
   - Download the Sense2Vec model from [this link](https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz) and extract the contents into the `backend` folder.

2. **Create and activate a Python virtual environment (recommended)**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies**:
   - With the virtual environment activated and while in `backend/`, install dependencies from `backend/requirements.txt`:
     ```bash
     pip install -r requirements.txt
     ```

4. **Run Flask app**:
   - Start the backend while in the `backend/` directory:
     ```bash
     python server.py
     ```
   - This will activate the backend for the application.

### Option 2: Automated Setup with Shell Script

1. **Run the Setup Script**:
   - The setup script performs the same steps listed in "Option 1: Manual Setup" (download and extract the Sense2Vec model, install Python dependencies, and start the Flask app).
   - You must run the script from the `backend/` directory. Navigate to `backend/` and run:
     ```bash
     ./script.sh
     ```
   - The script will automatically download and extract the Sense2Vec model, install Python dependencies, and start the Flask app.

### Troubleshooting

- If the script fails to run, ensure that you have execution permissions:
  ```bash
  chmod +x script.sh
  ```
## 3. Configure Google APIs

Security note: Google API credential files contain sensitive secrets and must never be committed to version control. Place all credential files inside the `backend/` directory and ensure they remain untracked (add them to `.gitignore`).

### Google Docs API

1. Place your Google Docs service account file named `service_account_key.json` in the `backend/` directory.
2. Open `backend/service_account_key.json` and enter the service account details required by the application.
3. Keep `backend/service_account_key.json` untracked in git (do not commit). Refer to the [Google Docs API documentation](https://developers.google.com/docs/api/reference/rest) for more details.

### Google Forms API

1. Place your Google Forms credentials file named `credentials.json` in the `backend/` directory.
2. Open `backend/credentials.json` and enter the necessary credentials for the Google Forms API.
3. Keep `backend/credentials.json` untracked in git (do not commit). Refer to the [Google Forms API quickstart guide](https://developers.google.com/forms/api/quickstart/python#set_up_your_environment) for setup instructions.

## 4. Extension Setup

### Install Dependencies

Navigate to the `extension` folder and install the required dependencies:

```bash
npm install
```
### Build the Project

Build the extension:

```bash
npm run build
```
### Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" (top-right corner).
3. Click on "Load Unpacked" and select the `dist` folder created in the previous step.

### EduAid Web App
In addition to the browser extension, EduAid also offers a web app that provides the same powerful features for quiz generation. The web app allows you to access EduAid's capabilities directly from your browser without needing to install any extensions. Just start the backend server locally and:

1. Navigate to the Web App Directory:
`cd eduaid_web`
2. Install Dependencies:
`npm install`
3. Start the Web App:
`npm run start`

## 5. Desktop App Setup

EduAid now includes a cross-platform desktop application built with Electron, providing a native desktop experience for all EduAid features.

### Prerequisites
- Node.js (version 16 or higher)
- Backend server running (follow steps 2-3 above)
- Web app built (follow step 4 above)

### Development Mode

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

### Production Build

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

### Desktop App Features
- **Native Desktop Experience**: Full desktop integration with native menus and keyboard shortcuts
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Security**: Secure communication with context isolation
- **Auto-Updates**: Built-in support for automatic updates

## Features

1. **Dynamic Question Generation**:
   - **Boolean Questions**: Quickly generate engaging true/false questions.
   - **Multiple-Choice Questions (MCQ)**: Create diverse MCQs with up to 4 options for comprehensive quizzes.
   - **Single Correct Answer Questions**: Formulate questions with one clear correct answer.
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
