document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("save-button");
  const backButton = document.getElementById("back-button");
  const viewQuestionsButton = document.getElementById("view-questions-button");
  const qaPairs = JSON.parse(localStorage.getItem("qaPairs"));
  const modalClose = document.querySelector("[data-close-modal]");
  const modal = document.querySelector("[data-modal]");

  viewQuestionsButton.addEventListener("click", displayQuestions);

  modalClose.addEventListener("click", closeModal);

  saveButton.addEventListener("click", downloadQuestions);

  backButton.addEventListener("click", function () {
    window.location.href = "../html/text_input.html";
  });

  function displayQuestions() {
    const modalQuestionList = document.getElementById("modal-question-list");
    modalQuestionList.innerHTML = "";

    for (const [question, answer] of Object.entries(qaPairs)) {
      const questionElement = document.createElement("li");
      questionElement.textContent = `Question: ${question}, Answer: ${answer}`;
      modalQuestionList.appendChild(questionElement);
    }
    modal.showModal();
  }

  function closeModal() {
    modal.close();
  }

  function downloadQuestions() {
    let textContent = "EduAid Generated QnA:\n\n";

    for (const [question, answer] of Object.entries(qaPairs)) {
      textContent += `Question: ${question}\nAnswer: ${answer}\n\n`;
    }

    const blob = new Blob([textContent], { type: "text/plain" });
    const blobUrl = URL.createObjectURL(blob);

    downloadLink(blobUrl, "questions_and_answers.txt");
  }

  function downloadLink(url, filename) {
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }
});
