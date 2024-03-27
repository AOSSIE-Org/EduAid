document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("start");

    startButton.addEventListener("click", function () {
        window.location.href = "../html/text_input.html"
    });

    const pastQuizzesButton = document.getElementById("past_quizzes")


    pastQuizzesButton.addEventListener("click", function () {
        window.open("../html/past_quizzes.html", "_blank");
    })
});
