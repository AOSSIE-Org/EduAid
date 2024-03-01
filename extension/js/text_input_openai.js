document.addEventListener("DOMContentLoaded", function () {
  const generateQuizButton = document.getElementById("generate-quiz");
  const loadingScreen = document.getElementById("loading-screen");

  generateQuizButton.addEventListener("click", async function () {
    loadingScreen.style.display = "flex";

    const apiKey = document.getElementById("api-key").value;
    const inputText = document.getElementById("quiz-text").value;
    const questionType = document.getElementById("question-type").value;

    if (inputText.trim() !== "") {
      try {
        await sendToBackend(inputText, apiKey, questionType);
      } catch (error) {
        console.error(error);
        alert("An error occurred. Please try again.");
      } finally {
        loadingScreen.style.display = "none";
      }
    } else {
      alert("Please enter text or upload a PDF file.");
      loadingScreen.style.display = "none";
    }
  });

  async function sendToBackend(data, apiKey ,questionType) {
    const response = await fetch("http://localhost:8000/generate_mcqs", {
      method: "POST",
      body: JSON.stringify({
        context: data,
        api_key: apiKey,
        question_type: questionType,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Backend request failed.");
    }

    const responseData = await response.json();
    localStorage.setItem("qaPairs", JSON.stringify(responseData));
    window.location.href = "../html/openai_question.html";
  }
});
