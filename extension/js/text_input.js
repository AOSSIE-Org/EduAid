document.addEventListener("DOMContentLoaded", function () {
  const nextButton = document.getElementById("next-button");
  const backButton = document.getElementById("back-button");
  const textInput = document.getElementById("text-input");
  const fileInput = document.getElementById("file-upload");
  const loadingScreen = document.getElementById("loading-screen");

  fileInput.addEventListener("change", async function () {
    const file = fileInput.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = async function (event) {
        const pdfData = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let pdfText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const pageText = await page.getTextContent();
          const pageStrings = pageText.items.map((item) => item.str);
          pdfText += pageStrings.join(" ");
        }

        textInput.value = pdfText;
      };
      fileReader.readAsArrayBuffer(file);
    }
  });

  nextButton.addEventListener("click", async function () {
    await generateQuestion("text");
  });

  backButton.addEventListener("click", function () {
    window.location.href = "../html/index.html";
  });
  document
    .getElementById("generate-quiz-button")
    .addEventListener("click", function () {
      window.location.href = "../html/openai_input_text.html";
    });

  async function generateQuestion(questionType) {
    loadingScreen.style.display = "flex";
    const inputText = textInput.value;

    if (inputText.trim() === "" && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileReader = new FileReader();
      fileReader.onload = async function (event) {
        const uploadedPdfData = new Uint8Array(event.target.result);
        await sendToBackend(uploadedPdfData, "pdf", questionType);
      };
      fileReader.readAsArrayBuffer(file);
    } else if (inputText.trim() !== "") {
      await sendToBackend(inputText, "text", questionType);
    } else {
      alert("Please enter text or upload a PDF file.");
      loadingScreen.style.display = "none";
    }
  }

  async function sendToBackend(data, dataType, questionType) {
    let formData;
    let contentType;
    formData = JSON.stringify({ input_text: data });
    contentType = "application/json";

    const response = await fetch("http://127.0.0.1:8000/", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": contentType,
        "Question-Type": questionType,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      localStorage.setItem("qaPairs", JSON.stringify(responseData));
      window.location.href = "../html/question_generation.html";
    } else {
      console.error("Backend request failed.");
    }
    loadingScreen.style.display = "none";
  }
});
