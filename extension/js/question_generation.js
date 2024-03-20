document.addEventListener("DOMContentLoaded", function(){
    const saveButton= document.getElementById("save-button");
    const backButton= document.getElementById("back-button");
    const viewQuestionsButton = document.getElementById("view-questions-button");
    const qaPairs=JSON.parse(localStorage.getItem("qaPairs"));
    const modalClose= document.querySelector("[data-close-modal]");
    const modal=document.querySelector("[data-modal]");


    viewQuestionsButton.addEventListener("click", function(){
      const modalQuestionList = document.getElementById("modal-question-list");
      modalQuestionList.innerHTML = ""; // Clear previous content

      for (const [question, answer] of Object.entries(qaPairs)) {
          const questionElement = document.createElement("li");
          questionElement.textContent = `Question: ${question}, Answer: ${answer}`;
          modalQuestionList.appendChild(questionElement)
      }
      modal.showModal();
      document.getElementById("mid-text").textContent="";
    });

    modalClose.addEventListener("click", function(){
      modal.close();
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