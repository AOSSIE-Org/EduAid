export function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

export function getEndpointForQuestionType(difficulty, questionType) {
  if (difficulty !== "Easy Difficulty") {
    if (questionType === "get_shortq") {
      return "get_shortq_hard";
    }

    if (questionType === "get_mcq") {
      return "get_mcq_hard";
    }
  }

  return questionType;
}

export function saveQuizHistory({ difficulty, numQuestions, qaPair }) {
  const quizDetails = {
    difficulty,
    numQuestions,
    date: new Date().toLocaleDateString(),
    qaPair,
  };

  const last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes") || "[]");
  last5Quizzes.push(quizDetails);

  if (last5Quizzes.length > 5) {
    last5Quizzes.shift();
  }

  localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
}

export function parseQaPairs(qaPairsFromStorage = {}, questionType) {
  const combinedQaPairs = [];

  if (qaPairsFromStorage.output_boolq) {
    const boolQuestions = qaPairsFromStorage.output_boolq.Boolean_Questions || [];
    boolQuestions.forEach((question) => {
      combinedQaPairs.push({
        question,
        question_type: "Boolean",
        context: qaPairsFromStorage.output_boolq.Text,
      });
    });
  }

  if (qaPairsFromStorage.output_mcq) {
    const mcqQuestions = qaPairsFromStorage.output_mcq.questions || [];
    mcqQuestions.forEach((qaPair) => {
      combinedQaPairs.push({
        question: qaPair.question_statement,
        question_type: "MCQ",
        options: qaPair.options,
        answer: qaPair.answer,
        context: qaPair.context,
      });
    });
  }

  if ((qaPairsFromStorage.output_mcq || questionType === "get_mcq") && Array.isArray(qaPairsFromStorage.output)) {
    qaPairsFromStorage.output.forEach((qaPair) => {
      combinedQaPairs.push({
        question: qaPair.question_statement,
        question_type: "MCQ",
        options: qaPair.options,
        answer: qaPair.answer,
        context: qaPair.context,
      });
    });
  }

  if (questionType === "get_boolq" && Array.isArray(qaPairsFromStorage.output)) {
    qaPairsFromStorage.output.forEach((qaPair) => {
      combinedQaPairs.push({
        question: qaPair,
        question_type: "Boolean",
      });
    });
  } else if (Array.isArray(qaPairsFromStorage.output) && questionType !== "get_mcq") {
    qaPairsFromStorage.output.forEach((qaPair) => {
      combinedQaPairs.push({
        question: qaPair.question || qaPair.question_statement || qaPair.Question,
        options: qaPair.options,
        answer: qaPair.answer || qaPair.Answer,
        context: qaPair.context,
        question_type: "Short",
      });
    });
  }

  return combinedQaPairs;
}
