import React, { useState, useEffect, useMemo, useRef } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionType, setQuestionType] = useState(
    localStorage.getItem("selectedQuestionType")
  );

  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);

  const pdfDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pdfDropdownRef.current &&
        !pdfDropdownRef.current.contains(event.target) &&
        !event.target.closest("button")
      ) {
        pdfDropdownRef.current.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qaPair) => {
      const options = qaPair.options
        ? [...qaPair.options, qaPair.answer]
        : [qaPair.answer];
      return shuffleArray(options);
    });
  }, [qaPairs]);

  const handleShuffleQuestions = () => {
    if (editingIndex !== null) return;
    setQaPairs(shuffleArray(qaPairs));
  };

  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setEditedQuestion(qaPairs[index].question);
    setEditedAnswer(qaPairs[index].answer || "");
    setEditedOptions(qaPairs[index].options || []);
  };

  const handleSaveQuestion = (index) => {
    const updated = [...qaPairs];
    const original = updated[index];

    updated[index] = {
      ...original,
      question: editedQuestion,
      answer: editedAnswer !== "" ? editedAnswer : original.answer,
      options:
        editedOptions.length > 0 ? editedOptions : original.options,
    };

    setQaPairs(updated);
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion("");
    setEditedAnswer("");
    setEditedOptions([]);
  };

  const handleOptionChange = (i, value) => {
    const updated = [...editedOptions];
    updated[i] = value;
    setEditedOptions(updated);
  };

  useEffect(() => {
    setLoading(true);

    let data = {};
    try {
      data = JSON.parse(localStorage.getItem("qaPairs")) || {};
    } catch {
      data = {};
    }

    const combined = [];

    // Boolean
    if (
      data.output_boolq &&
      data.output_boolq.Boolean_Questions
    ) {
      data.output_boolq.Boolean_Questions.forEach((q) => {
        combined.push({
          question: q,
          question_type: "Boolean",
          context: data.output_boolq.Text,
        });
      });
    }

    // MCQ
    if (data.output_mcq && data.output_mcq.questions) {
      data.output_mcq.questions.forEach((q) => {
        combined.push({
          question: q.question_statement,
          question_type: "MCQ",
          options: q.options,
          answer: q.answer,
          context: q.context,
        });
      });
    }

    // MCQ via output
    if (questionType === "get_mcq" && data.output) {
      data.output.forEach((q) => {
        combined.push({
          question: q.question_statement,
          question_type: "MCQ",
          options: q.options,
          answer: q.answer,
          context: q.context,
        });
      });
    }

    // Boolean via output
    if (questionType === "get_boolq" && data.output) {
      data.output.forEach((q) => {
        combined.push({
          question: q,
          question_type: "Boolean",
        });
      });
    }

    // Short
    if (data.output && questionType !== "get_mcq") {
      data.output.forEach((q) => {
        combined.push({
          question:
            q.question ||
            q.question_statement ||
            q.Question,
          options: q.options,
          answer: q.answer || q.Answer,
          context: q.context,
          question_type: "Short",
        });
      });
    }

    setQaPairs(combined);
    setLoading(false);
  }, [questionType]);

  const generateGoogleForm = async () => {
    try {
      const result = await apiClient.post("/generate_gform", {
        qa_pairs: qaPairs,
        question_type: questionType,
      });

      const link =
        typeof result === "string" ? result : result?.form_link;

      if (!link) throw new Error("No form link");

      window.open(link, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("Failed to generate Google Form");
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!qaPairs.length) {
    return (
      <div>
        No quiz available. Please generate a quiz first.
        <br />
        <Link to="/input">Go to input page</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Generated Questions</h2>

      <button
        onClick={handleShuffleQuestions}
        aria-label="Shuffle questions"
      >
        <FiShuffle />
      </button>

      {qaPairs.map((qa, i) => {
        const isEditing = editingIndex === i;

        return (
          <div key={i}>
            {!isEditing ? (
              <>
                <p>{qa.question}</p>
                <button onClick={() => handleEditQuestion(i)}>
                  <FiEdit2 />
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={editedQuestion}
                  onChange={(e) =>
                    setEditedQuestion(e.target.value)
                  }
                />
                <button onClick={() => handleSaveQuestion(i)}>
                  <FiCheck />
                </button>
                <button onClick={handleCancelEdit}>
                  <FiX />
                </button>
              </>
            )}
          </div>
        );
      })}

      <button onClick={generateGoogleForm}>
        Generate Google Form
      </button>
    </div>
  );
};

export default Output;