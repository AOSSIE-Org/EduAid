// prompts.js

export const getBoolqPrompt = (paragraph, numQuestions, diff) => {
  return `Based on the following paragraph, generate ${numQuestions} ${diff} get_boolq questions and return the response as a JSON object only, without any additional text, formatting, or backticks. The response should be exactly in this format:

  {
    "output": [
      "Question 1",
      "Question 2",
      "Question 3",
      "...",
    ]
  }

  Only return the JSON object. Do not include any additional explanation or formatting. Paragraph: ${paragraph}`;
};

export const getShortqPrompt = (paragraph, numQuestions, diff) => {
  return `Based on the following paragraph, generate ${numQuestions} ${diff} get_shortq questions and return the response as a JSON object only, without any additional text, formatting, or backticks. The response should be exactly in this format:

  {
    "output": [
      {
        "Answer": "",
        "Question": "",
        "context": "",
        "id 1": "",
      },
      {
        "Answer": "",
        "Question": "",
        "context": "",
        "id 2": "",
      },
      {
        "Answer": "",
        "Question": "",
        "context": "",
        "id 3": "",
      },
      {"..."},
    ]
  }

  Only return the JSON object. Do not include any additional explanation or formatting. Paragraph: ${paragraph}`;
};

export const getProblemsPrompt = (paragraph, numQuestions, diff) => {
  return `Based on the following paragraph, generate ${numQuestions} ${diff} get_problems questions and return the response as a JSON object only, without any additional text, formatting, or backticks. The response should be exactly in this format:

  {
    "output_boolq": {
      "Boolean_Questions": [
        "",
        "",
        "",
        ""
      ],
      "Count": 4,
      "Text": ""
    },
    "output_mcq": {
      "questions": [
        {
          "answer": "",
          "context": "",
          "extra_options": [
            "",
            "",
            "",
            "",
            "",
            ""
          ],
          "id": 1,
          "options": [
            "",
            "",
            ""
          ],
          "question_statement": "",
          "question_type": "MCQ"
        },
        {
          "answer": "",
          "context": "",
          "extra_options": [
            ""
          ],
          "id": 2,
          "options": [
            "",
            "",
            ""
          ],
          "question_statement": "",
          "question_type": "MCQ"
        }
      ],
      "statement": "",
      "time_taken": ,
    },
    "output_shortq": {
      "questions": [
        {
          "Answer": "",
          "Question": "",
          "context": "",
          "id": 1
        },
        {
          "Answer": "",
          "Question": "",
          "context": "",
          "id": 2
        }
      ],
      "statement": ""
    }
  }

  Only return the JSON object. Do not include any additional explanation or formatting. Paragraph: ${paragraph}`;
};
