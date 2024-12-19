
# EduAid: AI Quiz Generation 🚀

Online learning has taken the front seat in the post-pandemic age. With the advent of sophisticated AI architectures like Transformers, it is only natural that AI would find its way into education. Learning online via platforms like YouTube or MOOCs is often a method of self-learning. The biggest obstacle faced by students in self-learning is the lack of attention span. An online tool that can generate short quizzes from input educational content can be a great resource for both teachers and students. It helps retain important information, frame questions, and quickly revise large chunks of content.

EduAid is one such project currently available in the form of a browser extension.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AOSSIE-Org/EduAid.git
cd EduAid
```

## 2. Docker Setup (Recommended)

For users who prefer an easier setup, Docker Compose simplifies the process of running both the frontend and backend in containers. With Docker, you don't need to worry about individual configurations and dependencies for the backend and frontend.

### Step 1: Docker Compose Setup

1. **Ensure Docker and Docker Compose are Installed:**
   - If you haven't already, make sure you have Docker and Docker Compose installed on your system. You can verify this by running:
     ```bash
     docker --version
     docker-compose --version
     ```

   - If you don't have Docker installed, you can get the installation instructions from the official website: [Docker Installation](https://docs.docker.com/get-docker/)

2. **Build and Run Containers with Docker Compose:**
   - From the root directory of the EduAid project, run the following command to build and start both the frontend and backend containers:
     ```bash
     docker-compose up --build
     ```

   This command will:
   - Build the Docker images for both the frontend and backend.
   - Start the containers for the frontend (on `localhost:3000`) and backend (on `localhost:5000`).

### Step 2: Access the Application

- Once the containers are running, access the following:
  - **Frontend**: Open your browser and navigate to `http://localhost:3000` to view the EduAid frontend.
  - **Backend**: Access the backend at `http://localhost:5000` (it will be running Flask as a backend API).

### Step 3: Stopping the Containers

To stop the running containers, use the following command:
```bash
docker-compose down
```

This will stop and remove the containers without affecting any of your data or configurations.

---

### Troubleshooting Docker Issues

If you run into any issues with Docker, such as disk space errors or old images lingering around, you can try running the following command to clean up your system:

```bash
docker system prune -a
```

This command will:
- Remove all stopped containers, unused networks, and dangling images (images that are not tagged and not associated with any containers).
- Be cautious, as this will delete unused images, which might require re-pulling them later if needed.

For more information on this command, check out the Docker documentation: [docker system prune](https://docs.docker.com/engine/reference/commandline/system_prune/)

---

### 3. Backend Setup (Manual Setup Option)

If you prefer to set up the backend manually without Docker, you can follow this option.

#### Option 1: Manual Setup

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

#### Option 2: Automated Setup with Shell Script

1. **Run the Setup Script**:
   - Navigate to the `backend` folder and run the following shell script:
     ```bash
     ./script.sh
     ```
   - This script will automatically download and extract the Sense2Vec model, install Python dependencies, and start the Flask app.

---

### 4. Configure Google APIs

#### Google Docs API

1. Navigate to the `backend` folder.
2. Open the `service_account_key.json` file.
3. Enter the service account details for the Google Docs API.
4. Refer to the [Google Docs API documentation](https://developers.google.com/docs/api/reference/rest) for more details.

#### Google Forms API

1. Open the `credentials.json` file in the `backend` folder.
2. Enter the necessary credentials for the Google Forms API.
3. Refer to the [Google Forms API quickstart guide](https://developers.google.com/forms/api/quickstart/python#set_up_your_environment) for setup instructions.

---

### 5. Extension Setup

If you want to use EduAid as a browser extension, follow these steps:

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

---

#### EduAid Web App

In addition to the browser extension, EduAid also offers a web app that provides the same powerful features for quiz generation. The web app allows you to access EduAid's capabilities directly from your browser without needing to install any extensions. Just start the backend server locally and:

1. Navigate to the Web App Directory:
   ```bash
   cd eduaid_web
   ```

2. Install Dependencies:
   ```bash
   npm install
   ```

3. Start the Web App:
   ```bash
   npm run start
   ```

---

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

---

## How to Contribute

This is the second year of the project. While some may have their own ideas on how to contribute, for the newcomers to the repository, you may follow the following steps: 

1. First get to know the organization and the project by visiting the [Official Website](https://github.com/AOSSIE-Org)

2. Visit the [Discord Channel](https://discord.com/channels/1022871757289422898/1073262393670504589) for interacting with the community!
