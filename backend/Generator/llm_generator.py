import json
import re
import threading
from llama_cpp import Llama


class LLMQuestionGenerator:
    """Generates various types of questions using Qwen3-0.6B via llama.cpp.
    Uses Q4_K_M quantization (~397MB) for fast CPU inference.
    Supports short-answer, multiple-choice, and boolean questions.
    """

    def __init__(self):
        self.llm = None
        self._llm_lock = threading.Lock()

    def _load_model(self):
        # First check: avoid lock overhead if already loaded
        if self.llm is None:
            with self._llm_lock:
                # Second check: verify still None after acquiring lock
                if self.llm is None:
                    print("Loading Qwen3-0.6B model (downloads ~397 MB on first run)...")
                    self.llm = Llama.from_pretrained(
                        repo_id="unsloth/Qwen3-0.6B-GGUF",
                        filename="Qwen3-0.6B-Q4_K_M.gguf",
                        n_ctx=8192,  # Model supports up to 40960; 8192 balances capacity vs memory
                        n_threads=4,
                        verbose=False,
                    )
                    print("Qwen3-0.6B model loaded successfully.")

    def _prepare_text(self, input_text, max_words=3000):
        """Prepare input text by truncating if necessary.
        With n_ctx=8192, ~3000 words leaves ample room for the prompt and response.
        """
        words = input_text.split()
        if len(words) > max_words:
            input_text = " ".join(words[:max_words])
        return input_text

    def generate_short_questions(self, input_text, max_questions=4):
        """Generate short-answer questions from the given text."""
        self._load_model()
        input_text = self._prepare_text(input_text)

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
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=512,
            temperature=0.7,
        )

        try:
            choices = response.get("choices", [])
            if not choices:
                return []

            raw = choices[0].get("message", {}).get("content", "")
            return self._parse_response(raw, max_questions)

        except Exception:
            return []

    def generate_mcq_questions(self, input_text, max_questions=4):
        """Generate multiple-choice questions from the given text."""
        self._load_model()
        input_text = self._prepare_text(input_text)

        prompt = (
            f"Generate exactly {max_questions} multiple-choice questions from this passage. "
            f"Each question should have 4 options (A, B, C, D) with one correct answer. "
            f"Return ONLY a JSON array, no other text.\n\n"
            f"Passage: {input_text}\n\n"
            f'Format: [{{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A"}}]\n'
            f"/no_think"
        )

        response = self.llm.create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You generate multiple-choice quiz questions as JSON arrays. Output ONLY valid JSON.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=1024,
            temperature=0.7,
        )

        try:
            choices = response.get("choices", [])
            if not choices:
                return []

            raw = choices[0].get("message", {}).get("content", "")
            return self._parse_mcq_response(raw, max_questions)

        except Exception:
            return []

    def generate_boolean_questions(self, input_text, max_questions=4):
        """Generate true/false questions from the given text."""
        self._load_model()
        input_text = self._prepare_text(input_text)

        prompt = (
            f"Generate exactly {max_questions} true/false questions from this passage. "
            f"Return ONLY a JSON array, no other text.\n\n"
            f"Passage: {input_text}\n\n"
            f'Format: [{{"question": "...", "answer": true/false}}]\n'
            f"/no_think"
        )

        response = self.llm.create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You generate true/false quiz questions as JSON arrays. Output ONLY valid JSON.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=512,
            temperature=0.7,
        )

        try:
            choices = response.get("choices", [])
            if not choices:
                return []

            raw = choices[0].get("message", {}).get("content", "")
            return self._parse_bool_response(raw, max_questions)

        except Exception:
            return []

    def generate_all_questions(self, input_text, mcq_count=2, bool_count=2, short_count=2):
        """Generate a mix of all question types."""
        questions = []

        # Generate MCQs
        mcqs = self.generate_mcq_questions(input_text, mcq_count)
        for mcq in mcqs:
            questions.append({
                "type": "mcq",
                "question": mcq["question"],
                "options": mcq["options"],
                "correct_answer": mcq["correct_answer"]
            })

        # Generate Boolean questions
        bool_qs = self.generate_boolean_questions(input_text, bool_count)
        for bool_q in bool_qs:
            questions.append({
                "type": "boolean",
                "question": bool_q["question"],
                "answer": bool_q["answer"]
            })

        # Generate Short questions
        short_qs = self.generate_short_questions(input_text, short_count)
        for short_q in short_qs:
            questions.append({
                "type": "short_answer",
                "question": short_q["question"],
                "answer": short_q["answer"]
            })

        return questions

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

    def _parse_mcq_response(self, raw_text, max_questions):
        """Parse MCQ response into structured format."""
        cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            try:
                mcq_list = json.loads(match.group())
                result = []
                for item in mcq_list[:max_questions]:
                    if isinstance(item, dict) and "question" in item and "options" in item and "correct_answer" in item:
                        result.append({
                            "question": item["question"].strip(),
                            "options": item["options"],
                            "correct_answer": item["correct_answer"].strip()
                        })
                if result:
                    return result
            except json.JSONDecodeError:
                pass

        return self._fallback_mcq_parse(cleaned, max_questions)

    def _parse_bool_response(self, raw_text, max_questions):
        """Parse boolean response into structured format."""
        cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            try:
                bool_list = json.loads(match.group())
                result = []
                for item in bool_list[:max_questions]:
                    if isinstance(item, dict) and "question" in item and "answer" in item:
                        parsed_answer = self._coerce_to_bool(item["answer"])
                        if parsed_answer is None:
                            continue
                        result.append({
                            "question": item["question"].strip(),
                            "answer": parsed_answer
                        })
                if result:
                    return result
            except json.JSONDecodeError:
                pass

        return self._fallback_bool_parse(cleaned, max_questions)

    def _coerce_to_bool(self, value):
        """Normalize common LLM boolean representations to a Python bool."""
        if isinstance(value, bool):
            return value

        if isinstance(value, (int, float)):
            if value == 1:
                return True
            if value == 0:
                return False
            return None

        if isinstance(value, str):
            normalized = value.strip().lower()
            truthy = {"true", "t", "yes", "y", "1"}
            falsy = {"false", "f", "no", "n", "0"}
            if normalized in truthy:
                return True
            if normalized in falsy:
                return False

        return None

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
                r"(?:Answer[:\.]|A:)\s*(.*)", line, re.IGNORECASE
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

    def _fallback_mcq_parse(self, text, max_questions):
        """Fallback parser for MCQ when JSON parsing fails."""
        questions = []
        lines = text.strip().split("\n")
        current_q = None
        options = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            q_match = re.match(r"(?:\d+[\.\)]\s*)?(?:Q(?:uestion)?[:\.]\s*)(.*)", line, re.IGNORECASE)
            opt_match = re.match(r"([A-D])[\)\.]\s*(.*)", line, re.IGNORECASE)
            ans_match = re.match(r"(?:Correct|Answer)[:\.]?\s*([A-D])", line, re.IGNORECASE)

            if q_match:
                if current_q and options:
                    questions.append({
                        "question": current_q,
                        "options": options[:4],
                        "correct_answer": "A"  # Default fallback
                    })
                current_q = q_match.group(1).strip()
                options = []
            elif opt_match and current_q:
                options.append(f"{opt_match.group(1).upper()}) {opt_match.group(2).strip()}")
            elif ans_match and current_q:
                correct = ans_match.group(1).upper()
                if current_q and options:
                    questions.append({
                        "question": current_q,
                        "options": options[:4],
                        "correct_answer": correct
                    })
                current_q = None
                options = []
                if len(questions) >= max_questions:
                    break

        return questions

    def _fallback_bool_parse(self, text, max_questions):
        """Fallback parser for boolean questions when JSON parsing fails."""
        questions = []
        lines = text.strip().split("\n")
        current_q = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if current_q:
                a_match = re.match(
                    r"(?:answer|ans|a)[:\.]?\s*(true|false|yes|no|1|0)\b",
                    line,
                    re.IGNORECASE,
                )
                if a_match:
                    parsed = self._coerce_to_bool(a_match.group(1))
                    if parsed is not None:
                        questions.append({"question": current_q, "answer": parsed})
                        current_q = None
                        if len(questions) >= max_questions:
                            break
                        continue

            q_with_answer_match = re.match(
                r"(?:\d+[\.\)]\s*)?(?:q(?:uestion)?[:\.]?\s*)?(.*\?)\s*(?:answer|ans|a)[:\.]?\s*(true|false|yes|no|1|0)\b",
                line,
                re.IGNORECASE,
            )
            if q_with_answer_match:
                question = q_with_answer_match.group(1).strip()
                parsed = self._coerce_to_bool(q_with_answer_match.group(2))
                if question and parsed is not None:
                    questions.append({"question": question, "answer": parsed})
                    if len(questions) >= max_questions:
                        break
                continue

            q_only_match = re.match(
                r"(?:\d+[\.\)]\s*)?(?:q(?:uestion)?[:\.]?\s*)?(.*\?)$",
                line,
                re.IGNORECASE,
            )
            if q_only_match:
                current_q = q_only_match.group(1).strip()
                continue

            # Look for question patterns
            q_match = re.match(r"(?:\d+[\.\)]\s*)?(.*\?)", line, re.IGNORECASE)
            if q_match:
                question = q_match.group(1).strip()
                # Simple heuristic: if question contains negation words, likely false
                is_false = any(word in question.lower() for word in ['not', 'never', 'no', 'false', 'incorrect'])
                questions.append({
                    "question": question,
                    "answer": not is_false  # True if no negation, False if negation
                })
                if len(questions) >= max_questions:
                    break

        return questions