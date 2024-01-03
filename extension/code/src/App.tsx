import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/Navbar";
import QuestionsGenerator from "./components/QuestionsGenerator.tsx";
import AnswerSpace from "./components/AnswersSpace.tsx";
import { useState } from "react";
import { AiResponse } from "./components/QuestionsGenerator.tsx";
import SplashScreenAnimation from "./components/SplashScreenAnimation.tsx";


function App() {
  const [generatedData, setGeneratedData] = useState<AiResponse | null>(null);
  const handleGenerate = (data: AiResponse) => {
    setGeneratedData(data);
  };
  const handleBackButtonClick = () => {
    setGeneratedData(null);
  };
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SplashScreenAnimation></SplashScreenAnimation>
      <Navbar />
      {generatedData ? (
        <AnswerSpace
          data={generatedData}
          onBackButtonClick={handleBackButtonClick}
        />
      ) : (
        <QuestionsGenerator onGenerate={handleGenerate} />
      )}
    </ThemeProvider>
  );
}

export default App;
