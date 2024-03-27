

document.addEventListener("DOMContentLoaded", function () {
    const quizList = document.getElementById("quiz-list");
    const pastQuizzes = JSON.parse(localStorage.getItem("past_quizzes")) || [];

    pastQuizzes.forEach((quiz, index) => {
        const quizItem = document.createElement("div");
        quizItem.classList.add("quiz-item");

        const quizHeader = document.createElement("button");
        quizHeader.classList.add("accordion");
        quizHeader.innerText = `Quiz ${index + 1}`;
        quizHeader.addEventListener("click", function () {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (this.classList.contains("active")) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });

        const quizContent = document.createElement("div");
        quizContent.classList.add("content");

        Object.entries(quiz).forEach(([question, answer], qIndex) => {
            const qaPair = document.createElement("p");
            qaPair.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question}<br/><strong>A:</strong> ${answer}`;
            quizContent.appendChild(qaPair);
        });

        const buttonRow = document.createElement("div");
        buttonRow.classList.add("button-row");

        const saveButton = document.createElement("button");
        saveButton.classList.add("save-button");
        saveButton.innerText = "Save to File";
        saveButton.addEventListener("click", async function () {
            let textContent = "EduAid Generated QnA:\n\n";

            for (const [question, answer] of Object.entries(quiz)) {
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

        buttonRow.appendChild(saveButton);

        quizItem.appendChild(quizHeader);
        quizItem.appendChild(quizContent);
        quizItem.appendChild(buttonRow);

        quizList.appendChild(quizItem);
    });
});
