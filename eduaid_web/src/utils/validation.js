export const validateTextInput = (text) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: "Please enter some text to generate questions." };
  }

  if (text.length < 50) {
    return { isValid: false, error: "Text is too short. Please provide at least 50 characters." };
  }

  if (text.length > 2500) {
    return { isValid: false, error: "Text exceeds the 2500 character limit. Please shorten your text." };
  }
  
  return { isValid: true, error: "" };
};