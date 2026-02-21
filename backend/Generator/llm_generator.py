import json
import re
from llama_cpp import Llama


class LLMShortAnswerGenerator:
    """Generates short-answer questions using Qwen3-0.6B via llama.cpp.
    Uses Q4_K_M quantization (~397MB) for fast CPU inference.
    """

    def __init__(self):
        self.llm = None

    def _load_model(self):
        if self.llm is None:
            print("Loading Qwen3-0.6B model (downloads ~397 MB on first run)...")
            self.llm = Llama.from_pretrained(
                repo_id="unsloth/Qwen3-0.6B-GGUF",
                filename="Qwen3-0.6B-Q4_K_M.gguf",
                n_ctx=2048,
                n_threads=4,
                verbose=False,
            )
            print("Qwen3-0.6B model loaded successfully.")

    def generate_short_questions(self, input_text, max_questions=4):
        """Generate short-answer questions from the given text."""
        self._load_model()

        # Truncate input to avoid blowing context window
        words = input_text.split()
        if len(words) > 500:
            input_text = " ".join(words[:500])

        prompt = (
            f"Generate exactly {max_questions} short-answer questions from this passage. "
            f"Return ONLY a JSON array, no other text.\n\n"
            f"Passage: {input_text}\n\n"
            f'Format: [{{"question": "...", "answer": "..."}}]\n'
            f"/no_think"
        )

        response = self.llm.create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You generate short-answer quiz questions as JSON arrays. Output ONLY valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=512,
            temperature=0.7,
        )

        raw = response["choices"][0]["message"]["content"]
        return self._parse_response(raw, max_questions)

    def _parse_response(self, raw_text, max_questions):
        """Parse the LLM response into structured Q&A pairs."""
        # Strip any <think>...</think> blocks the model might produce
        cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

        # Try to extract a JSON array from the text
        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            try:
                qa_list = json.loads(match.group())
                result = []
                for item in qa_list[:max_questions]:
                    if isinstance(item, dict) and "question" in item and "answer" in item:
                        result.append(
                            {
                                "question": item["question"].strip(),
                                "answer": item["answer"].strip(),
                                "context": "",
                            }
                        )
                if result:
                    return result
            except json.JSONDecodeError:
                pass

        # Fallback: try to extract Q&A pairs line by line
        return self._fallback_parse(cleaned, max_questions)

    def _fallback_parse(self, text, max_questions):
        """Fallback parser for when JSON parsing fails."""
        questions = []
        lines = text.strip().split("\n")
        current_q = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            q_match = re.match(
                r"(?:\d+[\.\)]\s*)?(?:Q(?:uestion)?[:\.]\s*)(.*)", line, re.IGNORECASE
            )
            a_match = re.match(
                r"(?:A(?:nswer)?[:\.]\s*)(.*)", line, re.IGNORECASE
            )

            if q_match:
                current_q = q_match.group(1).strip()
            elif a_match and current_q:
                questions.append(
                    {
                        "question": current_q,
                        "answer": a_match.group(1).strip(),
                        "context": "",
                    }
                )
                current_q = None
                if len(questions) >= max_questions:
                    break

        return questions
