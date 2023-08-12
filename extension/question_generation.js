document.addEventListener("DOMContentLoaded", function(){
    const saveButton= document.getElementById("save-button");
    const backButton= document.getElementById("back-button");

    const qaPairs=JSON.parse(localStorage.getItem("qaPairs"));

    const questionList=document.getElementById("question-list");

    for (const [question, answer] of Object.entries(qaPairs)) {
        const questionElement = document.createElement("li");
        questionElement.textContent = `Question: ${question}, Answer: ${answer}`;
        questionList.appendChild(questionElement);
      }

      saveButton.addEventListener("click", async function(){
        alert("Questions saved!");
      });
      
      backButton.addEventListener("click", function(){
        window.location.href="text_input.html"
      });
});