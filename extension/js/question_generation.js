document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("save-button");
  const backButton = document.getElementById("back-button");
  const viewQuestionsButton = document.getElementById("view-questions-button");
  const qaPairs = JSON.parse(localStorage.getItem("qaPairs"));
  const modalClose = document.querySelector("[data-close-modal]");
  const modal = document.querySelector("[data-modal]");

  viewQuestionsButton.addEventListener("click", function () {
    const modalQuestionList = document.getElementById("modal-question-list");
    modalQuestionList.innerHTML = "";

    for (const [question, answer] of Object.entries(qaPairs)) {
      const questionElement = document.createElement("li");
      if (question.includes("Options:")) {
        const options = question.split("Options: ")[1].split(", ");
        const formattedOptions = options.map(
          (opt, index) => `${String.fromCharCode(97 + index)}) ${opt}`
        );
        questionElement.textContent = `Question: ${
          question.split(" Options:")[0]
        }\n${formattedOptions.join("\n")}`;
      } else {
        questionElement.textContent = `Question: ${question}\n\nAnswer: ${answer}\n`;
      }

      modalQuestionList.appendChild(questionElement);
    }
    modal.showModal();
  });

  modalClose.addEventListener("click", function () {
    modal.close();
  });
  saveButton.addEventListener("click", async function () {
    let textContent = "EduAid Generated QnA:\n\n";

    for (const [question, answer] of Object.entries(qaPairs)) {
      textContent += `Question: ${question}\nAnswer: ${answer}\n\n`;
    }
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

  backButton.addEventListener("click", function () {
    window.location.href = "../html/text_input.html";
  });
});
