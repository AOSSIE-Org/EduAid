import React, { useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export interface AiResponse {
  one_word: { question: string; answer: string }[];
}
interface QuestionsGeneratorProps {
  onGenerate: (data: AiResponse) => void;
}

const QuestionsGenerator: React.FC<QuestionsGeneratorProps> = ({
  onGenerate,
}) => {
  const [content, setContent] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<any>(false);

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value);
  };

  const openFileExplorer = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null; // Set to null if no file selected
    setFile(selectedFile);
  };

  const handleGenerateQuiz = async () => {
    // setLoading(true);

    // // Simulate server request with a delay (1 second sleep)
    // console.log(content);
    // console.log("Requesting server...");
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // // Simulate the server response
    // const sampleAiModelResponse = {
    //   one_word: [
    //     {
    //       question:
    //         "What is a subject area within microbiology and genetic engineering?",
    //       answer: "Microbial Genetics",
    //     },
    //     {
    //       question: "What is an example of genetic engineering?",
    //       answer: "Cloning",
    //     },
    //     {
    //       question: "What is a process of genetic engineering?",
    //       answer: "Dna Technology",
    //     }
    //   ],
    // };

    // // Call the callback function with the generated data
    // onGenerate(sampleAiModelResponse);

    // setLoading(false);

    setLoading(true);

    const formData = {
      input_text: content, // Assuming 'content' is the data you want to send to the backend
    };

    try {
      const response = await fetch("http://127.0.0.1:8000", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("qaPairs", JSON.stringify(responseData));
        console.log(responseData)
        onGenerate(responseData)
      } else {
        console.error("Backend request failed.");
        // Handle the error as needed
      }
    } catch (error) {
      console.error(
        "An error occurred while communicating with the backend.",
        error
      );
      // Handle the error as needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full border rounded-md gap-6 p-2">
      <h1 className="text-4xl">Generate Quiz</h1>

      <div className="flex flex-col w-full gap-1 flex-grow">
        <Label className="text-muted-foreground" htmlFor="message">
          Content
        </Label>
        <Textarea
          placeholder="Paste your Content for your Quiz"
          id="message"
          onChange={handleContentChange}
          className="flex-grow"
        />
      </div>

      <div className="grid w-full gap-1">
        <Label className="text-muted-foreground" htmlFor="file-upload">
          upload file
        </Label>
        <Button onClick={openFileExplorer} variant="outline" className="w-full">
          Browse
        </Button>
        <span className="text-xs">
          {file?.name}
          {file ? "*" : ""}
        </span>
        <input
          type="file"
          id="file"
          accept=".pdf"
          onChange={handleFileChange}
          ref={fileInputRef}
          // hidden
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: "0",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            border: "0",
          }}
        ></input>
      </div>

      <Button onClick={handleGenerateQuiz} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </Button>
    </div>
  );
};

export default QuestionsGenerator;
