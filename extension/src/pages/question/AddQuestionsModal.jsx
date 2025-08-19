import React, { useState } from "react";

const AddQuestionModal = ({ handleCloseModal }) => {
  const questionType = localStorage.getItem("selectedQuestionType");
  const [questionTypeOption, setQuestionType] = useState("");

  const handleAddQuestion = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const objects = Object.fromEntries(formData);

    if (questionTypeOption !== "") {
      if (questionTypeOption === "get_boolq") {
        const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
        mlQuestions["output_boolq"]["Boolean_Questions"].push(
          `${objects.question}`
        );
        mlQuestions["output_boolq"]["Count"] =
          mlQuestions["output_boolq"]["Boolean_Questions"].length;
        localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));

        const updatedQaPairs = JSON.parse(localStorage.getItem("qaPairs"));
        const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];

        if (last5Quizzes.length > 0) {
          last5Quizzes[0].qaPair = updatedQaPairs;
          localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
        }

        window.location.reload();
        handleCloseModal();
      } else if (questionTypeOption === "get_shortq") {
        const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
        mlQuestions["output_shortq"]["questions"].push({
          Answer: objects.answer,
          Question: objects.question,
          context: objects.context,
          id: mlQuestions["output_shortq"]["questions"].length + 1,
        });
        localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));

        const updatedQaPairs = JSON.parse(localStorage.getItem("qaPairs"));
        const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];

        if (last5Quizzes.length > 0) {
          last5Quizzes[0].qaPair = updatedQaPairs;
          localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
        }

        window.location.reload();
        handleCloseModal();
      } else if (questionTypeOption === "get_mcq") {
        const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
        mlQuestions["output_mcq"]["questions"].push({
          answer: objects.answer,
          context: objects.context,
          extra_options: [],
          id: mlQuestions["output_mcq"]["questions"].length + 1,
          options: [objects.option1, objects.option2, objects.option3],
          options_algorithm: "self_added",
          question_statement: objects.question,
          question_type: "MCQ",
        });
        localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));

        const updatedQaPairs = JSON.parse(localStorage.getItem("qaPairs"));
        const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];

        if (last5Quizzes.length > 0) {
          last5Quizzes[0].qaPair = updatedQaPairs;
          localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
        }

        window.location.reload();
        handleCloseModal();
      }
      return;
    }

    if (questionType === "get_boolq") {
      const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
      mlQuestions["output"].push(`${objects.question}`);
      localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));

      const updatedQaPairs = JSON.parse(localStorage.getItem("qaPairs"));
      const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];

      if (last5Quizzes.length > 0) {
        last5Quizzes[0].qaPair = updatedQaPairs;
        localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
      }

      window.location.reload();
      handleCloseModal();
    } else if (questionType === "get_shortq") {
      const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
      mlQuestions["output"].push({
        Answer: objects.answer,
        Question: objects.question,
        context: objects.context,
        id: mlQuestions["output"].length + 1,
      });
      localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));

      const updatedQaPairs = JSON.parse(localStorage.getItem("qaPairs"));
      const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];

      if (last5Quizzes.length > 0) {
        last5Quizzes[0].qaPair = updatedQaPairs;
        localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
      }

      window.location.reload();
      handleCloseModal();
    } else if (questionType === "get_mcq") {
      const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
      mlQuestions["output"].push({
        answer: objects.answer,
        context: objects.context,
        extra_options: [],
        id: mlQuestions["output"].length + 1,
        options: [objects.option1, objects.option2, objects.option3],
        options_algorithm: "self_added",
        question_statement: objects.question,
        question_type: "MCQ",
      });
      localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));

      const updatedQaPairs = JSON.parse(localStorage.getItem("qaPairs"));
      const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];

      if (last5Quizzes.length > 0) {
        last5Quizzes[0].qaPair = updatedQaPairs;
        localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
      }

      window.location.reload();
      handleCloseModal();
    }
  };

  const renderInputsForProblems = () => {
    const inputClass =
      "w-full px-3 py-2 bg-white/5 border border-indigo-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-indigo-300/50 text-indigo-100";
    const labelClass = "block text-indigo-200 text-sm font-medium mb-1";

    switch (questionTypeOption) {
      case "get_shortq":
        return (
          <>
            <div className="mb-4">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={inputClass}
                required
                placeholder="Enter the answer"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Context</label>
              <input
                type="text"
                name="context"
                className={inputClass}
                placeholder="Add context (optional)"
                defaultValue={""}
              />
            </div>
          </>
        );
      case "get_mcq":
        return (
          <>
            <div className="mb-4">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={inputClass}
                required
                placeholder="Enter the correct answer"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Option 1</label>
              <input
                type="text"
                name="option1"
                className={inputClass}
                required
                placeholder="Enter option 1"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Option 2</label>
              <input
                type="text"
                name="option2"
                className={inputClass}
                required
                placeholder="Enter option 2"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Option 3</label>
              <input
                type="text"
                name="option3"
                className={inputClass}
                required
                placeholder="Enter option 3"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Context</label>
              <input
                type="text"
                name="context"
                className={inputClass}
                placeholder="Add context (optional)"
                defaultValue={""}
              />
            </div>
          </>
        );
      case "get_boolq":
        return (
          <>
            <div className="mb-4">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your true/false question"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Answer</label>
              <select name="choice" className={inputClass}>
                <option value="true" className="text-black">
                  True
                </option>
                <option value="false" className="text-black" selected>
                  False
                </option>
              </select>
            </div>
          </>
        );
      default:
        return <></>;
    }
  };

  const renderInputs = () => {
    const selectClass =
      "w-full px-3 py-2 bg-white/5 border border-indigo-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-indigo-100";
    const labelClass = "block text-indigo-200 text-sm font-medium mb-1";

    switch (questionType) {
      case "get_shortq":
        return (
          <>
            <div className="mb-4">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={selectClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={selectClass}
                required
                placeholder="Enter the answer"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Context</label>
              <input
                type="text"
                name="context"
                className={selectClass}
                placeholder="Add context (optional)"
                defaultValue={""}
              />
            </div>
          </>
        );
      case "get_mcq":
        return (
          <>
            <div className="mb-4">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={selectClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={selectClass}
                required
                placeholder="Enter the correct answer"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Option 1</label>
              <input
                type="text"
                name="option1"
                className={selectClass}
                required
                placeholder="Enter option 1"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Option 2</label>
              <input
                type="text"
                name="option2"
                className={selectClass}
                required
                placeholder="Enter option 2"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Option 3</label>
              <input
                type="text"
                name="option3"
                className={selectClass}
                required
                placeholder="Enter option 3"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Context</label>
              <input
                type="text"
                name="context"
                className={selectClass}
                placeholder="Add context (optional)"
                defaultValue={""}
              />
            </div>
          </>
        );
      case "get_boolq":
        return (
          <>
            <div className="mb-4">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={selectClass}
                required
                placeholder="Enter your true/false question"
              />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Answer</label>
              <select name="choice" className={selectClass}>
                <option value="true" className="text-black">
                  True
                </option>
                <option value="false" className="text-black" selected>
                  False
                </option>
              </select>
            </div>
          </>
        );
      default:
        return (
          <>
            <select
              name="Question_type"
              value={questionTypeOption}
              onChange={(e) => setQuestionType(e.target.value)}
              className={`${selectClass} mb-4`}
            >
              <option value="" selected className="text-black">
                Select Question Type
              </option>
              <option value="get_shortq" className="text-black">
                Short-Answer Type
              </option>
              <option value="get_mcq" className="text-black">
                Multiple Choice
              </option>
              <option value="get_boolq" className="text-black">
                True/False
              </option>
            </select>
            {renderInputsForProblems()}
          </>
        );
    }
  };

  return (
    <div className="relative z-50 flex flex-col items-center justify-center p-4 bg-[#0D0D0D] rounded-lg shadow-md">
      {/* Close overlay - optional, or you can remove if you don't need a background curtain */}
      <button
        onClick={handleCloseModal}
        className="absolute top-2 right-2 text-sm text-white bg-red-400 px-2 py-1 rounded-md"
      >
        X
      </button>

      <h2 className="text-xl font-bold mb-4 text-white">Add Question</h2>
      <form onSubmit={handleAddQuestion} className="space-y-4 w-72">
        {renderInputs()}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded transition"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-5 py-1.5 text-purple-200 bg-purple-500/10 hover:bg-purple-600/20 border border-purple-500/20 rounded transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestionModal;