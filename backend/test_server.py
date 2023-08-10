import requests

url='http://127.0.0.1:8000'

sample_input="""
Mitochondria are double-membraned organelles with an inner membrane that forms cristae. The enzymes within the inner membrane are essential for ATP production during oxidative phosphorylation. The outer membrane provides a protective barrier and contains porins to allow the passage of ions and molecules. The matrix, the innermost compartment, is involved in citric acid cycle and houses the mitochondrial DNA. The electron transport chain, present in the inner membrane, is responsible for electron transport and the generation of the electrochemical gradient. Overall, mitochondria function as the cell's powerhouses, producing energy through cellular respiration and maintaining cellular processes like apoptosis.
"""

response=requests.post(url,data={"input_text": sample_input})

result=response.json()

for question,answer in result.items():
    print(f'Question: {question}')
    print(f'Answer: {answer}')
    print('-'*30)