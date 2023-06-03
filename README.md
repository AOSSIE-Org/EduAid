# EduAid- Experiments
This branch contains the experiments on the AI models involved in EduAid. The fine-tuned models may be accessed [here](https://drive.google.com/drive/folders/12Srtnl8zqjO3_MEP85t6X44alc7AGcol?usp=sharing). 

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
