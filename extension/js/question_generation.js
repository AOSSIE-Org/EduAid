document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("save-button");
  const backButton = document.getElementById("back-button");
  const viewQuestionsButton = document.getElementById("view-questions-button");
  const modalClose = document.querySelector("[data-close-modal]");
  const modal = document.querySelector("[data-modal]");
  const modalQuestionList = document.getElementById("modal-question-list");
  const addButton = document.getElementById("add-button");

  let qaPairs = JSON.parse(localStorage.getItem("qaPairs")) || {};

  function updateLocalStorageAndDisplay() {
    localStorage.setItem("qaPairs", JSON.stringify(qaPairs));
    modalQuestionList.innerHTML = ""; // Clear previous content
    for (const [question, answer] of Object.entries(qaPairs)) {
      const questionElement = document.createElement("li");
      questionElement.innerHTML = `Question: <span class="question-text">${question}</span>, Answer: <span class="answer-text">${answer}</span> <button class="delete-button">Delete</button>`;
      modalQuestionList.appendChild(questionElement);

      // Attach event listener to delete button
      const deleteButton = questionElement.querySelector(".delete-button");
      deleteButton.addEventListener("click", function () {
        delete qaPairs[question];
        updateLocalStorageAndDisplay(); // Update localStorage and display after deletion
      });

      // Attach event listener to each question for modification
      const questionText = questionElement.querySelector(".question-text");
      questionText.addEventListener("click", function () {
        const newQuestion = prompt("Enter the new question:", question);
        if (newQuestion !== null) {
          qaPairs[newQuestion] = qaPairs[question];
          delete qaPairs[question];
          updateLocalStorageAndDisplay(); // Update localStorage and display after modification
        }
      });

      // Attach event listener to each answer for modification
      const answerText = questionElement.querySelector(".answer-text");
      answerText.addEventListener("click", function () {
        const newAnswer = prompt("Enter the new answer for the question:", answer);
        if (newAnswer !== null) {
          qaPairs[question] = newAnswer;
          updateLocalStorageAndDisplay(); // Update localStorage and display after modification
        }
      });
    }
  }

  viewQuestionsButton.addEventListener("click", function () {
    updateLocalStorageAndDisplay();
    modal.showModal();
  });

  modalClose.addEventListener("click", function () {
    modal.close();
  });

  addButton.addEventListener("click", function () {
    const newQuestion = prompt("Enter the new question:");
    const newAnswer = prompt("Enter the answer for the new question:");
    if (newQuestion && newAnswer) {
      qaPairs[newQuestion] = newAnswer;
      updateLocalStorageAndDisplay(); // Update localStorage and display after addition
    } else {
      alert("Please enter both question and answer!");
    }
  });

  saveButton.addEventListener("click", async function () {
    let textContent = "EduAid Generated QnA:\n\n";

    for (const [question, answer] of Object.entries(qaPairs)) {
      textContent += `Question: ${question}\nAnswer: ${answer}\n\n`;
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

  backButton.addEventListener("click", function () {
    window.location.href = "../html/text_input.html"
  });
});