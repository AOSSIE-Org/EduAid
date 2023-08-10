document.addEventListener("DOMContentLoaded", function(){
    const inputElement=document.getElementById("input-text");

    document.getElementById("submit-btn").addEventListener("click", async()=>{
        const inputText=inputElement.value;

        const response=await fetch("http://127.0.0.1:8000", {
            method: "POST",
            headers:{
                "Content-type": "application/json"
            },
            body: JSON.stringify({input_text:inputText})
        });

        const data = await response.json();

        const questionAnswers=Object.entries(data);

        const resultDiv=document.getElementById("result");

        resultDiv.innerHTML= "";
        for (const [question, answer] of questionAnswers){
            const questionElement=document.createElement("p");
            questionElement.textContent=`Question: ${question}`;
            const answerElement=document.createElement("p");
            answerElement.textContent=`Answer: ${answer}`;
            resultDiv.appendChild(questionElement);
            resultDiv.appendChild(answerElement);
        }
    });
});
