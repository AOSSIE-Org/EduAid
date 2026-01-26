const mockResponses = {
  '/generate-quiz': {
    success: true,
    qaPairs: [
      {
        question: "What is 2 + 2?",
        answer: "4",
        question_type: "Short"
      }
    ]
  }
};

export function getMockResponse(endpoint) {
  return mockResponses[endpoint] || { success: true };
}
