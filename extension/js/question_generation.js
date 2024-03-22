document.addEventListener("DOMContentLoaded", function(){
    const saveButton= document.getElementById("save-button");
    const backButton= document.getElementById("back-button");
    const viewQuestionsButton = document.getElementById("view-questions-button");
    const qaPairs=JSON.parse(localStorage.getItem("qaPairs"));
    const questionListDiv = document.getElementById("questionList");



    let isOpen = false; // Initially closed

viewQuestionsButton.addEventListener("click", () => {
    if (isOpen) {
        // Close the section
        questionListDiv.style.display = "none";
        viewQuestionsButton.textContent = "View";
        isOpen = false;
    } else {
        // Open the section
        questionListDiv.innerHTML = ""; // Clear previous content

        for (const [question, answer] of Object.entries(qaPairs)) {
            const questionAnswerDiv = document.createElement("div");
            questionAnswerDiv.classList.add("question-answer");
            questionAnswerDiv.innerHTML = `
                <h4>Q) ${question}</h4>
                <p>Ans:     ${answer}</p>
            `;
            questionListDiv.appendChild(questionAnswerDiv);
        }

        questionListDiv.style.display = "block";
        viewQuestionsButton.textContent = "Close";
        isOpen = true;
    }
});
    saveButton.addEventListener("click", async function(){
      let textContent= "EduAid Generated QnA:\n\n";

      for (const [question,answer] of Object.entries(qaPairs)){
        textContent+= `Question: ${question}\nAnswer: ${answer}\n\n`;
      }
      const blob = new Blob([textContent], { type: "text/plain" });

        // Create a URL for the Blob
        const blobUrl = URL.createObjectURL(blob);

        // Create a temporary <a> element to trigger the download
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = "questions_and_answers.txt";
        downloadLink.style.display = "none";

        // Append the <a> element to the document
        document.body.appendChild(downloadLink);

        // Simulate a click on the link to trigger the download
        downloadLink.click();

        // Clean up: remove the temporary <a> element and revoke the Blob URL
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
    });
      
      backButton.addEventListener("click", function(){
        window.location.href="../html/text_input.html"
      });
});