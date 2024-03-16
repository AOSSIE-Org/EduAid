document.addEventListener("DOMContentLoaded", function () {
    const QuickQ = document.getElementById("Quick_Quiz");
    const QnA = document.getElementById("Generate_QnA");

    QnA.addEventListener("click", function () {
      window.location.href = "../html/Question_generation.html";
    });
  });