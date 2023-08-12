document.addEventListener("DOMContentLoaded", function(){
    const nextButton=document.getElementById("next-button");
    const backButton=document.getElementById("back-button");
    const textInput=document.getElementById("text-input");
    
    nextButton.addEventListener("click", async function(){
        const inputText=textInput.value;

        const response= await fetch("http://127.0.0.1:8000", {
            method:"POST",
            body:JSON.stringify({text:inputText}),
            headers:{
                "Content-Type":"application/json"
            }
        });

        const responseData = await response.json();

        localStorage.setItem("qaPairs", JSON.stringify(responseData));
        
        window.location.href="question_generation.html"
    });
    backButton.addEventListener("click", function(){
        window.location.href="index.html";
    });
});