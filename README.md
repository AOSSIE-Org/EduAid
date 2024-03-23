# EduAid: AI Quiz Generation🚀
Online learning has taken the front seat in the post pandemic age. With the advent of sophisticated AI architectures like the Transformers, it is but natural that AI would find its way into education. Learning online via YouTube or MOOC platforms is often done as a method of self learning. The biggest obstacle faced by a student in self learning is the lack of attention span. An online tool that can generate short quizzes on input educational content can be of great use to teachers and students alike as it can help retain important information, frame questions and quickly revise large chunks of content. 

EduAid is one such project which is currently available in the form of a browser extension. 

## Installation

Currently, the extension is not deployed, so it can only run locally. To run the extension locally, clone the github repo using:


```
git clone https://github.com/AOSSIE-Org/EduAid.git
```

### Installation of `Generator Model`

1. **Move Repository Folder:**
   - Move the cloned repository folder inside the `backend` folder using the command `cd backend`.
  
2. **Install the Following Repository:**
   - Install the repository from [https://github.com/Roaster05/Generator.git](https://github.com/Roaster05/Generator.git).
   - Move the cloned repository folder inside the `backend` folder.

3. **Download Sense2Vec Model:**
   - Download the compressed folder from [here](https://github.com/explosion/sense2vec/releases/download/v1.0.0/s2v_reddit_2015_md.tar.gz).

4. **Extract Sense2Vec Model:**
   - Extract the contents of the downloaded compressed folder inside the `backend` folder.

5. **Install Python Dependencies:**
   - Navigate to the root repository folder.
   - Run the following command to install the required Python dependencies:
     ```
     pip install -r requirements.txt
     ```

6. **Run Flask App:**
   - Navigate to the `backend` folder.
   - Run the following command to start the Flask app:
     ```
     python app.py
     ```

7. **Verify Installation:**
   - The Flask app will start running at endpoint [http://127.0.0.1:5000](http://127.0.0.1:5000).
   - Verify the installation by making a GET request to the mentioned endpoint.
  
8. **Verify Folder Structure:**
   - The folder structure inside the `backend` folder should look like this (you can ignore any of the `_pycache_` files.)
   ```
    ├── app.py
    ├── Generator
    │   ├── encoding
    │   │   ├── encoding.py
    │   │   ├── _init_.py
    │   ├── _init_.py
    │   ├── main.py
    │   ├── mcq
    │   │   ├── _init_.py
    │   │   ├── mcq.py
    │   │   
    │   └── train
    │       ├── _init_.py
    │       └── train_gpu.py
    ├── models
    │   ├── modelA
    │   │   ├── config.json
    │   │   ├── generation_config.json
    │   │   └── pytorch_model.bin
    │   └── modelB
    │       ├── config.json
    │       ├── generation_config.json
    │       └── pytorch_model.bin
    ├── s2v_old
    │   ├── cfg
    │   ├── freqs.json
    │   ├── key2row
    │   ├── strings.json
    │   └── vectors
    ├── server.py
    └── test_server.py
   ```
   


### Installing Other Models

Now move to the `backend` directory and make a new directory that will store the models.



```
cd backend && mkdir models && cd models && mkdir modelA && mkdir modelB
```

Download the model files from 🤗 Hub: [model A](https://huggingface.co/prarabdhshukla/fine-tuned-t5-keyphrase-detection) [model B](https://huggingface.co/prarabdhshukla/fine-tuned-t5-answer-aware-question-generation/tree/main) and place them in the respective folders. 

Finally, the `models` should look like this:

```
+---models
ª   +---modelA
ª   ª       config.json
ª   ª       generation_config.json
ª   ª       pytorch_model.bin
ª   ª
ª   +---modelB
ª           config.json
ª           generation_config.json
ª           pytorch_model.bin
```

Now run the script `server.py`

```
cd .. && python3 server.py
```

Now go the extensions page of your browser and load the directory `EduAid/extension` and you're ready to roll! 

To load an unpacked directory as an extension in a browser, you might have to turn on *Developer mode* on your browser.

**Note:** This extension was tested on Google Chrome and Brave. The instructions on how to run it on Chrome can be found [here](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/). For Brave, the steps are the same with minor differences.

## How to use

After opening the extension and clicking on the 'Fire up!' button, we currently have support for two methods of accepting input:

1. Typing out the text or by pasting from the clipboard
2. By uploading a PDF

Then after clicking the next button, the questions are generated, which can either be viewed in the extension popup itself or can be downloaded as a `.txt` file.

![eduaid-demo](./readme-assets/EduAid-demo.gif)

**Note:** If your machine has GPU, the inference time should be faster. On CPU, it can take from a few seconds to a few minutes for inference. On an AMD RYZEN 5 8GB CPU with 6 cores, the inference time is usually 45-70 seconds. The inference time may differ depending on the specifications of your machine.

## How to contribute

This is the first year of the project. While some may have their own ideas on how to contribute, for the newcomers to the repository, you may follow the following steps: 

1. First get to know the organization and the project by visiting the [Official Website](http://aossie.gitlab.io/)

2. Visit the [Discord Channel](https://discord.com/channels/1022871757289422898/1073262393670504589) for interacting with the community!


