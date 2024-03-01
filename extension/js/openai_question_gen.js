document.addEventListener("DOMContentLoaded", function () {
  const viewQuestionsButton = document.getElementById("view-questions-button");
  const modal = document.querySelector("dialog");
  const modalQuestionList = document.getElementById("modal-question-list");
  const closeButton = modal.querySelector("[data-close-modal]");
  const saveButton = document.getElementById("save-button");

  viewQuestionsButton.addEventListener("click", function () {
    const qaPairsString = localStorage.getItem("qaPairs");
    const qaPairs = JSON.parse(qaPairsString);

    if (!qaPairs || !qaPairs.length) {
      alert("No questions available. Please generate questions first.");
      return;
    }

    populateQuestions(qaPairs);
    openModal();
  });

  closeButton.addEventListener("click", closeModal);
  saveButton.addEventListener("click", async function () {
    let textContent = "EduAid Generated QnA:\n\n";
    const qaPairsString = localStorage.getItem("qaPairs");
    const qaPairs = JSON.parse(qaPairsString);
    if (!qaPairs || !qaPairs.length) {
      alert("No questions available. Please generate questions first.");
      return;
    }
    textContent += qaPairsString;
    const blob = new Blob([textContent], { type: "text/plain" });

    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = "questions_and_answers.txt";
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(blobUrl);
  });
  function populateQuestions(qaPairs) {
    modalQuestionList.innerHTML = qaPairs;
  }

  function openModal() {
    modal.showModal();
  }

  function closeModal() {
    modal.close();
  }
});
