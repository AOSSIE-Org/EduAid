function generateList() {
    const qaArray = JSON.parse(localStorage.getItem("qaArray"));
    const qaPairsList = document.getElementById("qaPairsList");
    
    if (qaArray) {
        qaPairsList.innerHTML = ""; // Clear previous content

qaArray.forEach((entry, idx) => {
    const listItem = document.createElement("li");

    // Create a container for the title and additional information
    const contentContainer = document.createElement("div");

    // Create the title
    const title = document.createElement("h3");
    title.textContent = entry.title; // Access the title directly
    contentContainer.appendChild(title);

    // Additional information container
    const additionalInfo = document.createElement("div");
    additionalInfo.classList.add("additional-info");
    additionalInfo.textContent = `Ques: ${Object.keys(entry.qapair).length}, Date: ${new Date(entry.date).toLocaleString()}`;
    contentContainer.appendChild(additionalInfo);

    // Create a button for each list item
    const button = document.createElement("button");
    button.classList.add("custom-button");
    button.textContent = "Open";

    // Attach click event listener to each button
    button.addEventListener("click", function() {
        setQaPairs(entry.qapair, idx);
        window.location.href = "../html/question_generation.html";
    });

    // Append button to list item
    contentContainer.appendChild(button);

    // Hover effect
    contentContainer.addEventListener("mouseenter", function() {
        additionalInfo.style.display = "block";
        button.style.display = "block";
    });
    contentContainer.addEventListener("mouseleave", function() {
        additionalInfo.style.display = "none";
        button.style.display = "none";
    });

    // Append content container to list item
    listItem.appendChild(contentContainer);

    // Append list item to the list
    qaPairsList.appendChild(listItem);
});

    } else {
        qaPairsList.innerHTML = "<li>No data available</li>";
    }
}

// Function to set qaPairs in localStorage
function setQaPairs(qaPairs, idx) {
    localStorage.setItem("qaPairs", JSON.stringify(qaPairs));
    console.log(`qaPairs set for index ${idx}`);
}
generateList();
