import React from 'react';
import ReactDOM from 'react-dom';
import "../../index.css";
import stars from "../../assets/stars.png";
import { FaArrowRight } from "react-icons/fa"; // Import the enter icon
import ExtensionShell from "../../components/layout/ExtensionShell";
import BrandHeader from "../../components/layout/BrandHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle, CardSubTitle } from "../../components/ui/Card";

const Previous = () => {
  const getQuizzesFromLocalStorage = () => {
    const quizzes = localStorage.getItem('last5Quizzes');
    return quizzes ? JSON.parse(quizzes) : [];
  };

  const [quizzes, setQuizzes] = React.useState(getQuizzesFromLocalStorage());

  const handleQuizClick = (quiz) => {
    localStorage.setItem("qaPairs", JSON.stringify(quiz.qaPair));
    window.location.href = "/src/pages/question/question.html";
  };

  const handleClearQuizzes = () => {
    localStorage.removeItem('last5Quizzes');
    setQuizzes([]);
  };

  const handleBack = () => {
    window.location.href = "/src/popup/popup.html";
  };

  return (
    <ExtensionShell>
      <BrandHeader compact />
      <div className="px-4 pb-4 flex-1 flex flex-col">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-extrabold text-2xl">Quiz dashboard</div>
            <div className="text-white/70 text-sm flex items-center gap-2 mt-1">
              Your <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text font-semibold">generated quizzes</span>
              <img className="h-[18px] w-[18px]" src={stars} alt="stars" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto scrollbar-hide">
          {quizzes.length === 0 ? (
            <Card className="text-center">
              <div className="text-white/80 text-sm">No quizzes available</div>
              <div className="text-white/50 text-xs mt-1">Generate a quiz to see it here.</div>
            </Card>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-white/10 transition flex items-center justify-between"
                  onClick={() => handleQuizClick(quiz)}
                >
                  <div>
                    <CardTitle>{quiz.difficulty} - {quiz.numQuestions} questions</CardTitle>
                    <CardSubTitle className="mt-1">{quiz.date}</CardSubTitle>
                  </div>
                  <FaArrowRight className="text-white/60" size={18} />
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" className="w-1/2" onClick={handleBack}>Back</Button>
          <Button variant="outline" className="w-1/2" onClick={handleClearQuizzes}>Clear</Button>
        </div>
      </div>
    </ExtensionShell>
  );
};

ReactDOM.render(<Previous />, document.getElementById('root'));
