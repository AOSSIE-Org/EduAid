from datasets import load_dataset
import torch
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
from transformers import T5Tokenizer, T5ForConditionalGeneration, AdamW
from tqdm import tqdm
from time import time



class HuggingFaceDataset(Dataset):
    def __init__(self,dataset):
        self.dataset=dataset
    def __getitem__(self,index):
        item=self.dataset[index]
        # ID=item['id']
        # title=item['title']
        # abstract=item['abstract']
        # keyphrases=item['keyphrases']
        # return ID,title,abstract,keyphrases
        return item
    def __len__(self):
        return len(self.dataset)
class kp_data(HuggingFaceDataset):

    def __init__(self,dataset,tokenizer):
        super().__init__(dataset)
        self.tokenizer=tokenizer
    
    def __getitem__(self,idx):
        item=super().__getitem__(idx)
        abstract=item['abstract']
        keyphrases=item['keyphrases']

        input_text=f'detect keyword: abstract:{abstract}'

        target_text=f'{", ".join(keyphrases)}'

        input_ids=self.tokenizer.encode(input_text, truncation=True, padding='max_length', max_length=512, return_tensors='pt')[0]
        target_ids=self.tokenizer.encode(target_text,truncation=True, padding='max_length', max_length=32, return_tensors='pt')[0]

        return {'input_ids': input_ids, 'attention_mask': input_ids.ne(0), 'target_ids':target_ids, 'target_attention_mask': target_ids.ne(0)}
    
def parse_list(L:list[str])->list[list[str]]:
    L_new=[]
    for i in L:
        L_new.append(i.split(','))
    return L_new

def clean_list(L:list[list[str]]):
    for i in range(len(L)):
        for j in range(len(L[i])):
            L[i][j]=L[i][j].strip().lower()
    return L

def recall_precision(y_true:list[list[str]], y_pred:list[list[str]])->float:
    n=len(y_pred)
    true_pos=0
    prec_denom=0
    rec_denom=0
    for i in range(n):
        preds=set(y_pred[i])
        prec_denom+=len(preds)
        truth=set(y_true[i])
        rec_denom+=len(truth)
        true_pos+= len(preds&truth)
    recall=true_pos/rec_denom
    precision=true_pos/prec_denom
    return recall,precision


def main():
    dataset=load_dataset('taln-ls2n/kp20k')
    # sample_percentage=0.1
    # dataset['test']=dataset['test'].shuffle()
    # num_samples=int(len(dataset['test'])*sample_percentage)
    # test_set=dataset['test'].select(range(num_samples))
    test_set=dataset['test']
    tokenizer_path='./fine_tuned_t5_tokenizer_kp'
    model_path='./fine_tuned_t5_model_kp'
    tokenizer=T5Tokenizer.from_pretrained(tokenizer_path)
    kp_test_set=kp_data(test_set,tokenizer)

    device=torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    model=T5ForConditionalGeneration.from_pretrained(model_path)
    model.to(device)
    batch_size=32
    model.eval()
    cutoff=10
    predicted_keyphrases = []
    target_keyphrases = []
    predicted_keyphrases10=[]
    target_keyphrases10= []
    dataloader=DataLoader(kp_test_set,batch_size=batch_size)
    with torch.no_grad():
        for batch_idx,batch in enumerate(tqdm(dataloader)):
            input_ids=batch['input_ids'].to(device)
            attention_mask=batch['attention_mask'].to(device)
            target_ids=batch['target_ids'].to(device)
            target_attention_mask=batch['target_attention_mask'].to(device)

            outputs=model.generate(input_ids=input_ids,attention_mask=attention_mask,max_length=32)
            predicted_phrases = [tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
            predicted_keyphrases.extend(predicted_phrases)
            # predicted_keyphrases10.extend(predicted_phrases[:cutoff])
            # for i, predicted_phrase in enumerate(predicted_phrases):
            #     predicted_keyphrases10.append(predicted_phrase)
            #     if i == cutoff-1:
            #         break
            target_phrases = [tokenizer.decode(target, skip_special_tokens=True) for target in target_ids]
            target_keyphrases.extend(target_phrases)
            # target_keyphrases10.extend(target_phrases[:cutoff])
    y_true=clean_list(parse_list(target_keyphrases))
    y_pred=clean_list(parse_list(predicted_keyphrases))

    recall,precision=recall_precision(y_true,y_pred)

    print("Recall: ",recall)
    print("Precision: ", precision)
        
   

if __name__=="__main__":
    main()