<<<<<<< HEAD
# EduAid
A tool that can auto-generate short quizzes on the basis of the content provided.
=======
# EduAid- Experiments
This branch contains the updates on the AI experiments as well as the development involved in the EduAid project. The AI models may be accessed [here](https://drive.google.com/drive/folders/12Srtnl8zqjO3_MEP85t6X44alc7AGcol?usp=sharing) (on a request basis). 

## Update 1 (3/6/2023): 
### KeyPhrase Detection (Model A)
For keyphrase detection, we currently use a combination of [KeyBERT](https://github.com/MaartenGr/KeyBERT) and [KeyPhraseVectorizers](https://github.com/TimSchopf/KeyphraseVectorizers).
In the coming days, we plan to also compare the performance of this setup to that of fine-tuned T5 and/or fine tuned BERT. Right now, the key idea is that, the KeyPhraseVectorizer,
performs POS-tagging on the input and extracts the noun phrases. The noun phrases are then fed to the KeyBERT package in the form of a vectorizer and then they are used 
(instead of the standard n-grams) as the candidate key phrases. These key-phrases can be then ranked according to the similarity of their BERT embeddings to the BERT embedding
of the input document. The top N are chosen as the keyphrases. 

### Answer Aware Question Generation[AAQG] (Model B)
For Answer Aware Question Generation, we fine tuned T5-base for this task on a sample of 100 data points of SQuAD v2.0 for 3 epochs using the AdamW optimizer. This is a baseline
for testing the feasibility and ensuring T5 is a suitable fit for our task.
### What's Next?

After setting up AWS, we will fine tune T5 and BERT for both these tasks (Model A and Model B) and expect better performance. Stay tuned for more updates!


## Update 2 (1/7/2023):
After a minor setback due AWS not being setup, we finally were able to procure GPU, thanks to Dr Soumajit Pramanik at the Indian Institute of Technology, Bhilai, who was thankful enough to let us use one of his high end workstations. 

### KeyPhrase Detection (Model A)

For KeyPhrase Detection, we fine tuned T5 to perform the task. Due to inconsistent availability of resources and due to having trained on multiple platforms, our training was not a smooth path. The model was frequently checkpointed to ensure transferrability between two different machines. The scripts used for this training can be found at ```Model_training/Keyphrase Detection```. 

Our stack mainly included PyTorch 🔥 and HuggingFace 🤗. 
The model was trained on the [KP20K dataset](https://huggingface.co/datasets/taln-ls2n/kp20k) which we used from 🤗 hub. We used an AdamW optimizer with a learning rate of 2e-5, with a StepLR scheduler for the learning rate, with step size 1 and gamma=0.1. We trained on a 25% sample of the data as training on the entire dataset seemed quite GPU intensive for our limited resources. 

For the above described setting, we trained the model for around 40 epochs. We achieved a recall of 20%, which seems good enough, because our objective is anyways not to reproduce all the keyphrases given in the dataset.

As a qualitative analysis of our model, we tested it on an NPTEL course transcript, which is very noisy and does not even have some complete sentences to try and see how the model would perform with a transcript (which is our end goal), and to our delight, the model was able to recognize the correct keyphrases from the topic of the lecture. 

### What's Next?
With the release of Update 2.0, our remote server is already grinding on training a model for answer aware question generation (model B). Also, we have identified some good first issues (GFS), which we will open up very soon in the coming days. Interested contributors may keep an eye on the repo for this, as this could be an opportunity to contribute to the project! The next update is surely a much much shorter wait than the second one. Stay tuned! 



## Update 3 (7/7/2023):

As promised, within a few days only, we have already hit our next milestone. Model B, which aims to perform Answer Aware Question Generation (AAQG), is now ready. The model is a fine tuned variant of `t5-base`, trained on the [Stanford Question Answering Dataset (SQuAD) v1.1](https://rajpurkar.github.io/SQuAD-explorer/explore/1.1/dev/). The model was trained for 30 epochs with an AdamW optimizer with a StepLR scheduler and a learning rate of 1e-4. This time, we used [this](https://huggingface.co/datasets/squad) version of SQuAD from 🤗 hub and did not carry out any sampling of the data for training. Training was once again carried out using the very reliable and flexible PyTorch 🔥. Our models have been uploaded to the Google Drive linked in the beginning (access will be restricted and granted on a case to case basis until the completion of the project). 

### What's Next?
Due to a restructuring in our project due to a change in the availability period of GPU for the project, we defer further experimentation and enhancements related to AI as a secondary task, and focus on the development of an application using the two wonderful models we have right now. Our next update will give you a glimpse of how Model A and Model B work in combination for the task of QnA generation. Stay tuned ;)

>>>>>>> exp
