# EduAid: AI Quiz Generation 🚀

Online learning has taken the front seat in the post-pandemic age. With the advent of sophisticated AI architectures like Transformers, it is only natural that AI would find its way into education. Learning online via platforms like YouTube or MOOCs is often a method of self-learning. The biggest obstacle faced by students in self-learning is the lack of attention span. An online tool that can generate short quizzes from input educational content can be a great resource for both teachers and students. It helps retain important information, frame questions, and quickly revise large chunks of content.

EduAid is one such project currently available as a browser extension and web app.

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AOSSIE-Org/EduAid.git
cd EduAid
```

### 2. Backend Setup

The backend should be set up and run inside a Python virtual environment to ensure isolated dependency management.

#### Step 1: Create a Virtual Environment

Navigate to the repository's root folder and create a virtual environment:

```bash
python -m venv env
source env/bin/activate  # On Windows, use `env\Scripts\activate`
```

#### Step 2: Download the Sense2Vec Model

1. Download the Sense2Vec model from [this link](https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz).
2. Extract the contents into the `backend` folder.

#### Step 3: Install Python Dependencies

Run the following command to install the required Python dependencies:

```bash
pip install -r requirements.txt
```

#### Step 4: Run the Flask App

Navigate to the `backend` folder and start the Flask app:

```bash
cd backend
python server.py
```

The backend server will now be active and ready for use.

---

### 3. Configure Google APIs

#### Google Docs API

1. Open the `service_account_key.json` file in the `backend` folder.
2. Enter the service account details for the Google Docs API.
3. Refer to the [Google Docs API documentation](https://developers.google.com/docs/api/reference/rest) for more details.

#### Google Forms API

1. Open the `credentials.json` file in the `backend` folder.
2. Enter the necessary credentials for the Google Forms API.
3. Refer to the [Google Forms API quickstart guide](https://developers.google.com/forms/api/quickstart/python#set_up_your_environment) for setup instructions.

---

### 4. Extension Setup

#### Install Dependencies

Navigate to the `extension` folder and install the required dependencies:

```bash
cd ../extension
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

### 5. Web App Setup

EduAid also offers a web app with the same powerful features for quiz generation.

#### Step 1: Navigate to the Web App Directory

```bash
cd ../eduaid_web
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Start the Web App

```bash
npm run start
```

The web app will now be accessible via your browser.

---

## Features

### 1. Dynamic Question Generation
- **Boolean Questions**: Quickly generate engaging true/false questions.
- **Multiple-Choice Questions (MCQ)**: Create diverse MCQs with up to 4 options for comprehensive quizzes.
- **Single Correct Answer Questions**: Formulate questions with one clear correct answer.
- **Customizable Question Count**: Tailor the number of questions to your needs—just select the type, set the number, and hit "Generate" to see your quiz come to life!

### 2. Quiz History at Your Fingertips
- **Last 5 Quizzes**: Instantly access and review the last 5 quizzes you've generated. No more losing track—your quiz history is always just a click away!

### 3. Smart Answer Generator
- **Automatic Answers**: Seamlessly generate answers for various question types. Toggle the switch on the Get Started page to enable or disable this feature.
- **MCQ Answer Magic**: For MCQs, provide the options and let the tool generate the perfect answers for you.

### 4. Wiki-Based Quiz Generation
- **Topic-Based Quizzes**: Missing text content for a topic? Toggle the switch in the bottom right corner of the Question Generator page to create a quiz based on the topic using external knowledge sources.

### 5. Flexible Quiz Input
- **File Parsing**: Upload `.txt`, `.docx`, or `.pdf` files to easily extract content for quiz creation.
- **Google Docs Integration**: Use the open shareable link from Google Docs to generate quizzes directly from your documents.

### 6. Enhanced Quiz Visibility
- **SidePanel View**: Enjoy an organized and enhanced view of your generated quizzes right in the SidePanel.

### 7. Editable Forms
- **PDF Forms**: Generate editable PDF forms based on your quizzes.
- **Google Forms**: Create Google Forms for your quizzes, perfect for easy distribution and response collection.

---

## How to Contribute

EduAid is in its second year of development. Contributors are welcome to help improve the project. For newcomers:

1. Learn more about the organization and the project by visiting the [Official Website](https://github.com/AOSSIE-Org).
2. Join the community via the [Discord Channel](https://discord.com/channels/1022871757289422898/1073262393670504589).
3. Fork the repository, explore open issues, and make pull requests to contribute.

---

## Troubleshooting

- If the backend script fails to run, ensure that you have execution permissions:

```bash
chmod +x script.sh
```

- For virtual environment issues, ensure that the `venv` directory is correctly created and activated before running any backend commands.

---
