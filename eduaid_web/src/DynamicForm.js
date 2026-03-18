import React, { useEffect, useState } from "react";

function DynamicForm() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  // 👉 Replace this with your deployed Google Apps Script URL
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxRamNfuS1b9yBXapdCs9gB3ScRhpxiRPbjTO0qrzeYel0BJEq4VyTGX3GnZ_-KIsZXkw/exec";

  // Fetch questions from Google Script
  useEffect(() => {
    fetch(GOOGLE_SCRIPT_URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched form data:", data);
        setQuestions(data);
      })
      .catch((err) => console.error("Error fetching form data:", err));
  }, []);

  // Handle input change
  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted answers:", answers);
    alert("Form submitted! Check console for answers.");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dynamic Google Form</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q) => (
          <div key={q.id} style={{ marginBottom: "20px" }}>
            <label>
              <strong>{q.title}</strong>
            </label>
            <br />

            {/* Render inputs based on question type */}
            {q.type === "TEXT" && (
              <input
                type="text"
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}

            {q.type === "PARAGRAPH_TEXT" && (
              <textarea
                onChange={(e) => handleChange(q.id, e.target.value)}
              ></textarea>
            )}

            {q.type === "MULTIPLE_CHOICE" &&
              q.choices?.map((choice, i) => (
                <div key={i}>
                  <input
                    type="radio"
                    name={q.id}
                    value={choice}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                  />
                  {choice}
                </div>
              ))}

            {q.type === "CHECKBOX" &&
              q.choices?.map((choice, i) => (
                <div key={i}>
                  <input
                    type="checkbox"
                    value={choice}
                    onChange={(e) => {
                      const selected = answers[q.id] || [];
                      if (e.target.checked) {
                        handleChange(q.id, [...selected, choice]);
                      } else {
                        handleChange(
                          q.id,
                          selected.filter((c) => c !== choice)
                        );
                      }
                    }}
                  />
                  {choice}
                </div>
              ))}

            {q.type === "LIST" && (
              <select onChange={(e) => handleChange(q.id, e.target.value)}>
                <option value="">Select</option>
                {q.choices?.map((choice, i) => (
                  <option key={i} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default DynamicForm;
