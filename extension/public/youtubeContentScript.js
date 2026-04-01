// Function to extract YouTube video ID from the URL
function getYouTubeVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
}

(() => {
    const videoId = getYouTubeVideoId();
    
    if (videoId) {
        console.log("Extracted YouTube Video ID:", videoId);
        
        fetch(`http://localhost:5000/getTranscript?videoId=${videoId}`)
            .then(response => response.json())
            .then(data => {
                if (data.transcript) {
                    console.log("Transcript received:", data.transcript);
                    chrome.storage.local.set({ videoTranscript: data.transcript }, () => {
                        console.log("Transcript saved in storage.");
                    });
                    generateQuestions(data.transcript);
                } else {
                    console.error("Failed to fetch transcript:", data.error);
                }
            })
            .catch(error => {
                console.error("Error fetching transcript:", error);
            });
    }
})();

// Function to generate quiz questions from transcript
function generateQuestions(transcript) {
    console.log("Generating questions from transcript...");
    chrome.storage.local.set({ "selectedText": transcript }, () => {
        console.log("Transcript stored for quiz generation.");
    });
}
