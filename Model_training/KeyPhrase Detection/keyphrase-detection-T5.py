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


def main():

    dataset = load_dataset("taln-ls2n/kp20k")
    sample_percentage=0.25

    dataset['train'] = dataset['train'].shuffle()
    num_samples = int(len(dataset['train']) * sample_percentage)
    train_set = dataset['train'].select(range(num_samples))

    model_name='t5-base'

    tokenizer=T5Tokenizer.from_pretrained(model_name)
    kp_dataset=kp_data(train_set,tokenizer)

    model=T5ForConditionalGeneration.from_pretrained(model_name)
    epochs=5
    batch_size=8
    learning_rate=2e-5
    dataloader=DataLoader(kp_dataset,batch_size=batch_size,shuffle=True)
    device=torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    model.to(device)
    optimizer=AdamW(model.parameters(),lr=learning_rate)
    scheduler=torch.optim.lr_scheduler.StepLR(optimizer, step_size=1, gamma=0.1)

    checkpoint_interval=1800  #Checkpoint every 30 minutes
    start_time=time()

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch_idx,batch in enumerate(tqdm(dataloader,desc=f'Epoch {epoch}')):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            target_ids = batch['target_ids'].to(device)
            target_attention_mask = batch['target_attention_mask'].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=target_ids, decoder_attention_mask=target_attention_mask)

            loss = outputs.loss
            total_loss += loss.item()

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            curr_time=time()
            elapsed_time=curr_time-start_time
            if elapsed_time >=checkpoint_interval:
                start_time=time()
                checkpoint = {
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'epoch': epoch,
                    'batch_idx': batch_idx,
                    'time': elapsed_time
                }
                 
                torch.save(checkpoint, './checkpoint.pt')
                print(f'Checkpoint at {(elapsed_time)/60} minutes saved!')
            

        scheduler.step()
        avg_loss = total_loss / len(dataloader)
        print(f"Epoch {epoch+1}/{epochs} - Loss: {avg_loss}")

    model.save_pretrained("./fine_tuned_t5_model_kp")
    tokenizer.save_pretrained("./fine_tuned_t5_tokenizer_kp")

if __name__=="__main__":
    main()