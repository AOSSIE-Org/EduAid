from datasets import load_dataset
import torch
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
from transformers import T5Tokenizer, T5ForConditionalGeneration, AdamW
from tqdm import tqdm
from time import time
import os


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

class SQuADDataset(HuggingFaceDataset):
    def __init__(self, dataset):
        super().__init__(dataset)
        self.tokenizer = T5Tokenizer.from_pretrained('t5-base')

    def __getitem__(self, index):
        item = self.dataset[index]

        context = item['context']
        answer = item['answers']['text'][0]

        input_text = f"answer: {answer} context: {context}"
        target_text = item['question']

        inputs = self.tokenizer.encode_plus(
            input_text,
            padding='max_length',
            truncation=True,
            max_length=512,
            return_tensors='pt'
        )

        targets = self.tokenizer.encode_plus(
            target_text,
            padding='max_length',
            truncation=True,
            max_length=32,
            return_tensors='pt'
        )

        return {
            'input_ids': inputs['input_ids'].squeeze(),
            'attention_mask': inputs['attention_mask'].squeeze(),
            'target_ids': targets['input_ids'].squeeze(),
            'target_attention_mask': targets['attention_mask'].squeeze()
        }

def main():

    dataset=load_dataset('squad')

    sample_percentage=1

    dataset['train'] = dataset['train'].shuffle()
    num_samples = int(len(dataset['train']) * sample_percentage)
    train_set = dataset['train'].select(range(num_samples))

    
    squad_dataset=SQuADDataset(train_set)

    model_path='t5-base'
    tokenizer_path='t5-base'

    model = T5ForConditionalGeneration.from_pretrained(model_path)
    tokenizer = T5Tokenizer.from_pretrained(tokenizer_path)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)

    batch_size=32
    lr=1e-4
    epochs=15

    dataloader=DataLoader(squad_dataset,batch_size=batch_size, shuffle=True)

    optimizer=AdamW(model.parameters(),lr=lr)
    scheduler=torch.optim.lr_scheduler.StepLR(optimizer, step_size=1, gamma=0.1)

    checkpoint_interval=1800

    start_time=time()
    START_TIME=time()

    for epoch in range(epochs):
        model.train()
        total_loss=0

        for batch_idx, batch in enumerate(tqdm(dataloader,desc=f'Epoch {epoch}')):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            target_ids = batch['target_ids'].to(device)
            target_attention_mask = batch['target_attention_mask'].to(device)

            outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=target_ids,
            decoder_attention_mask=target_attention_mask,
            return_dict=True
            )
            
            loss=outputs.loss
            total_loss+=loss.item()
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            curr_time=time()
            elapsed_time=curr_time-start_time
            if elapsed_time>=checkpoint_interval:
                start_time=time()
                checkpoint={
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'epoch': epoch,
                    'batch_idx': batch_idx,
                    'time': curr_time-START_TIME
                }
                try:
                    if os.path.exists('./checkpoint/pt'):
                        os.remove('./checkpoint.pt')
                    torch.save(checkpoint, './checkpoint.pt')
                    print(f'Checkpoint at {(curr_time-START_TIME)/60} minutes saved!')
                except Exception as e:
                    print("Error while saving checkpoint ",e)
            
        scheduler.step()
        avg_loss = total_loss / len(dataloader)
        print(f"Epoch {epoch+1}/{epochs} - Loss: {avg_loss}")
    
    model.save_pretrained('./fine_tuned_t5_model_aaqg')
    tokenizer.save_pretrained('./fine_tuned_t5_tokenizer_aaqg')


if __name__=="__main__":
    main()

