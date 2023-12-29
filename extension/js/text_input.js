document.addEventListener("DOMContentLoaded", function () {
  const nextButton = document.getElementById("next-button");
  const backButton = document.getElementById("back-button");
  const textInput = document.getElementById("text-input");
  const fileInput = document.getElementById("file-upload");
  const loadingScreen = document.getElementById("loading-screen");

  fileInput.addEventListener("change", handleFileChange);

  nextButton.addEventListener("click", handleNextClick);

  backButton.addEventListener("click", function () {
    window.location.href = "../html/index.html";
  });

  async function handleFileChange() {
    const file = fileInput.files[0];
    if (file) {
      const pdfData = await readPdfFile(file);
      textInput.value = pdfData;
    }
  }

  async function handleNextClick() {
    loadingScreen.style.display = "flex";
    const inputText = textInput.value.trim();

    if (inputText === "" && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const uploadedPdfData = await readPdfFile(file);
      await sendToBackend(uploadedPdfData, "pdf");
    } else if (inputText !== "") {
      await sendToBackend(inputText, "text");
    } else {
      alert("Please enter text or upload a PDF file.");
      loadingScreen.style.display = "none";
    }
  }

  async function readPdfFile(file) {
    const fileReader = new FileReader();
    return new Promise((resolve) => {
      fileReader.onload = function (event) {
        const pdfData = new Uint8Array(event.target.result);
        resolve(pdfData);
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  async function sendToBackend(data, dataType) {
    const formData = JSON.stringify({ input_text: data });
    const contentType = "application/json; charset=UTF-8";

    try {
      const response = await fetch("http://127.0.0.1:8000", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": contentType,
        },
      });

      if (!response.ok) {
        throw new Error("Backend request failed.");
      }

      const responseData = await response.json();
      localStorage.setItem("qaPairs", JSON.stringify(responseData));
      window.location.href = "../html/question_generation.html";
    } catch (error) {
      console.error(error.message);
    } finally {
      loadingScreen.style.display = "none";
    }
  }
});
