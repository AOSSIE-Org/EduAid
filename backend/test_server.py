# import requests
# from sample_input import sample_input
# url='http://127.0.0.1:8000'

# # sample_input="""
# # Mitochondria are double-membraned organelles with an inner membrane that forms cristae. The enzymes within the inner membrane are essential for ATP production during oxidative phosphorylation. The outer membrane provides a protective barrier and contains porins to allow the passage of ions and molecules. The matrix, the innermost compartment, is involved in citric acid cycle and houses the mitochondrial DNA. The electron transport chain, present in the inner membrane, is responsible for electron transport and the generation of the electrochemical gradient. Overall, mitochondria function as the cell's powerhouses, producing energy through cellular respiration and maintaining cellular processes like apoptosis.
# # """

# response=requests.post(url,data={"input_text": sample_input})

# result=response.json()

# for question,answer in result.items():
#     print(f'Question: {question}')
#     print(f'Answer: {answer}')
#     print('-'*30)
import http.server
import json
import random
import socketserver

import requests
import torch
from models.modelC.distractor_generator import DistractorGenerator
from transformers import T5ForConditionalGeneration, T5Tokenizer, pipeline


def main():
    distractor_generator = (
        DistractorGenerator()
    )  # Instantiate DistractorGenerator if needed
    t5_distractors = distractor_generator.generate(
        5,
        "islamic revival",
        "What is islamicism?",
        """Islamism, also known as Political Islam (Arabic: إسلام سياسي islām siyāsī), is an Islamic revival movement often characterized by moral conservatism, literalism, and the attempt "to implement Islamic values in all spheres of life." Islamism favors the reordering of government and society in accordance with the Shari'a. The different Islamist movements have been described as "oscillating between two poles": at one end is a strategy of Islamization of society through state power seized by revolution or invasion; at the other "reformist" pole Islamists work to Islamize society gradually "from the bottom up". The movements have "arguably altered the Middle East more than any trend since the modern states gained independence", redefining "politics and even borders" according to one journalist (Robin Wright).
""",
    )
    print(t5_distractors)


if __name__ == "__main__":
    main()
