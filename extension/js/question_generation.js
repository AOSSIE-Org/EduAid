document.addEventListener("DOMContentLoaded", function () {
    const saveButton = document.getElementById("save-button");
    const backButton = document.getElementById("back-button");
    const qaPairs = JSON.parse(localStorage.getItem("qaPairs"));
    const modal = document.querySelector("[data-modal]");


    const modalQuestionList = document.getElementById("qna");
    //      modalQuestionList.innerHTML = ""; // Clear previous content

    for (const [question, answer] of Object.entries(qaPairs)) {
        const questionElement = document.createElement("p");
        const answerElement = document.createElement("p");

        questionElement.textContent = `Question: ${question}`;
        answerElement.textContent = `Answer: ${answer}`;

        questionElement.classList.add("quesstyle");
        answerElement.classList.add("ansstyle");

        modalQuestionList.appendChild(questionElement)
        modalQuestionList.appendChild(answerElement)
    }
    //      modal.showModal();

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
        window.location.href = "../html/choice.html"
    });
});