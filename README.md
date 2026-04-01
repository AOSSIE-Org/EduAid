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

You can choose to set up the backend manually or use an automated shell script.

### Option 1: Manual Setup

1. **Download the Sense2Vec Model**:
   - Download the Sense2Vec model from [this link](https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz) and extract the contents into the `backend` folder.

2. **Install Python Dependencies**:
   - Navigate to the root repository folder and run the following command to install the required Python dependencies:
     ```bash
     pip install -r requirements.txt
     ```

3. **Run Flask App**:
   - Navigate to the `backend` folder and start the Flask app:
     ```bash
     python server.py
     ```
   - This will activate the backend for the application.

### Option 2: Automated Setup with Shell Script

1. **Run the Setup Script**:
   - Navigate to the `backend` folder and run the following shell script:
     ```bash
     ./script.sh
     ```
   - This script will automatically download and extract the Sense2Vec model, install Python dependencies, and start the Flask app.

### Troubleshooting

- If the script fails to run, ensure that you have execution permissions:
  ```bash
  chmod +x script.sh


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