const QUIZ_HISTORY_STORAGE_KEY = "last5Quizzes";

const clearStoredQuizHistory = () => {
  localStorage.removeItem(QUIZ_HISTORY_STORAGE_KEY);
};

const isQuotaExceededError = (error) => {
  if (!error) {
    return false;
  }

  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
};

export const readQuizHistory = () => {
  const storedQuizzes = localStorage.getItem(QUIZ_HISTORY_STORAGE_KEY);
  if (!storedQuizzes) {
    return [];
  }

  try {
    const parsedQuizzes = JSON.parse(storedQuizzes);
    if (Array.isArray(parsedQuizzes)) {
      return parsedQuizzes;
    }

    clearStoredQuizHistory();
    return [];
  } catch {
    clearStoredQuizHistory();
    return [];
  }
};

const persistQuizHistory = (quizHistory) => {
  try {
    localStorage.setItem(QUIZ_HISTORY_STORAGE_KEY, JSON.stringify(quizHistory));
    return true;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      return false;
    }

    // Keep as much recent history as possible when storage quota is reached.
    const trimmedHistory = [...quizHistory];
    while (trimmedHistory.length > 0) {
      trimmedHistory.shift();

      try {
        localStorage.setItem(QUIZ_HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
        return true;
      } catch (persistError) {
        if (!isQuotaExceededError(persistError)) {
          return false;
        }
      }
    }

    clearStoredQuizHistory();
    return false;
  }
};

export const appendQuizHistory = (quizDetails) => {
  const quizHistory = readQuizHistory();
  quizHistory.push(quizDetails);
  return persistQuizHistory(quizHistory);
};

export const clearQuizHistory = () => {
  clearStoredQuizHistory();
};