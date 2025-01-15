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
        window.location.reload();
        handleCloseModal();
      }
      return;
    }

    if (questionType === "get_boolq") {
      const mlQuestions = JSON.parse(localStorage.getItem("qaPairs"));
      mlQuestions["output"].push(`${objects.question}`);
      localStorage.setItem("qaPairs", JSON.stringify(mlQuestions));
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
      window.location.reload();
      handleCloseModal();
    }
  };

  const renderInputsForProblems = () => {
    const inputClass =
      "w-full px-4 py-3 bg-white/5 border border-indigo-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-indigo-300/50 text-indigo-100";
    const labelClass = "block text-indigo-200 text-sm font-medium mb-2";

    switch (questionTypeOption) {
      case "get_shortq":
        return (
          <>
            <div className="mb-6">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={inputClass}
                required
                placeholder="Enter the answer"
              />
            </div>
            <div className="mb-6">
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
            <div className="mb-6">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={inputClass}
                required
                placeholder="Enter the correct answer"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Option 1</label>
              <input
                type="text"
                name="option1"
                className={inputClass}
                required
                placeholder="Enter option 1"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Option 2</label>
              <input
                type="text"
                name="option2"
                className={inputClass}
                required
                placeholder="Enter option 2"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Option 3</label>
              <input
                type="text"
                name="option3"
                className={inputClass}
                required
                placeholder="Enter option 3"
              />
            </div>
            <div className="mb-6">
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
            <div className="mb-6">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your true/false question"
              />
            </div>
            <div className="mb-6">
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
      "w-full px-4 py-3 bg-white/5 border border-indigo-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-indigo-100";
    const inputClass =
      "w-full px-4 py-3 bg-white/5 border border-indigo-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-indigo-300/50 text-indigo-100";
    const labelClass = "block text-indigo-200 text-sm font-medium mb-2";

    switch (questionType) {
      case "get_shortq":
        return (
          <>
            <div className="mb-6">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={inputClass}
                required
                placeholder="Enter the answer"
              />
            </div>
            <div className="mb-6">
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
            <div className="mb-6">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your question"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Answer</label>
              <input
                type="text"
                name="answer"
                className={inputClass}
                required
                placeholder="Enter the correct answer"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Option 1</label>
              <input
                type="text"
                name="option1"
                className={inputClass}
                required
                placeholder="Enter option 1"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Option 2</label>
              <input
                type="text"
                name="option2"
                className={inputClass}
                required
                placeholder="Enter option 2"
              />
            </div>
            <div className="mb-6">
              <label className={labelClass}>Option 3</label>
              <input
                type="text"
                name="option3"
                className={inputClass}
                required
                placeholder="Enter option 3"
              />
            </div>
            <div className="mb-6">
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
            <div className="mb-6">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                name="question"
                className={inputClass}
                required
                placeholder="Enter your true/false question"
              />
            </div>
            <div className="mb-6">
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
              className={`${selectClass} mb-6`}
            >
              <option value="" selected className="text-black">
                Select Question Type
              </option>
              <option value="get_shortq" className="text-black">
                Short-Answer Type Questions
              </option>
              <option value="get_mcq" className="text-black">
                Multiple Choice Questions
              </option>
              <option value="get_boolq" className="text-black">
                True/False Questions
              </option>
            </select>
            {renderInputsForProblems()}
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-gradient-to-l from-[#ff005d8e] to-[#7500f285] backdrop-blur-sm"
        onClick={handleCloseModal}
      />
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-b from-indigo-900/95 to-purple-900/95 rounded-2xl shadow-2xl border border-indigo-500/20">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Add Question</h2>
          <form onSubmit={handleAddQuestion} className="space-y-6">
            {renderInputs()}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-900"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 font-medium rounded-lg transition-colors duration-200 border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-indigo-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddQuestionModal;
