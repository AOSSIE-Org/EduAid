# EduAid: AI Quiz Generation 🚀

Online learning has taken the front seat in the post-pandemic age. With the advent of sophisticated AI architectures like Transformers, it is only natural that AI would find its way into education. Learning online via platforms like YouTube or MOOCs is often a method of self-learning. The biggest obstacle faced by students in self-learning is the lack of attention span. An online tool that can generate short quizzes from input educational content can be a great resource for both teachers and students. It helps retain important information, frame questions, and quickly revise large chunks of content.

EduAid is one such project currently available in the form of a browser extension.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AOSSIE-Org/EduAid.git
cd EduAid
```
### 2. Backend Setup
- Download the Sense2Vec model from [this link](https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz) and extract the contents into the `backend` folder.
- Extract the contents of the downloaded compressed folder inside the backend folder.

- Install Python Dependencies
Navigate to the root repository folder and run the following command to install the required Python dependencies:
```bash
pip install -r requirements.txt
```
- Run Flask App
Navigate to the backend folder and start the Flask app:
```bash
python server.py
```
This will activate the backend for the application.

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


