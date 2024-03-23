document.addEventListener("DOMContentLoaded", function(){
    const startButton=document.getElementById("start");
    const previousButton = document.getElementById("previous")
    startButton.addEventListener("click", function(){
        window.location.href="../html/text_input.html"
    });
    previousButton.addEventListener("click", function(){
        window.location.href="../html/previous.html"
    });
});