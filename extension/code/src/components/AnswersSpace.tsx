import React from 'react';
import OneWordAnsCard from './OneWordAnsCard.tsx';
import { Button } from './ui/button.tsx';

interface AnswerSpaceProps {
  data: {
    mcqs?: {
      question: string;
      answer: string;
      options: string[];
    }[];
    one_word?: {
      question: string;
      answer: string;
    }[];
  };
  onBackButtonClick: () => void;
}
function generateTextData(data: AnswerSpaceProps['data']): string {
  if (!data) return '';

  let text = '';

  if (data.one_word) {
    text += 'One Word Answers\n\n';
    data.one_word.forEach((item, index) => {
      text += `Question ${index + 1}: ${item.question}\n`;
      text += `Answer ${index + 1}: ${item.answer}\n\n`;
    });
  }

  if (data.mcqs) {
    text += 'Multiple Choice Questions\n\n';
    data.mcqs.forEach((item, index) => {
      text += `Question ${index + 1}: ${item.question}\n`;
      text += `Answer ${index + 1}: ${item.answer}\n`;
      text += `Options: ${item.options.join(', ')}\n\n`;
    });
  }

  return text;
}
const AnswerSpace: React.FC<AnswerSpaceProps> = ({ data, onBackButtonClick}) => {
  function downloadQA() {
    const textData = generateTextData(data);

    const blob = new Blob([textData], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'questions_and_answers.txt';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  }

  return (
    <div className='flex flex-col items-center'>
      {data.one_word && (
        <div className='flex flex-col items-center w-full'>
          <h2 className="text-2xl mt-3 mb-3">One Word Answers</h2>
          {data.one_word.map((item, index) => (
            <OneWordAnsCard key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      )}
      <Button onClick={downloadQA} className='mt-2 mb-2'>Download</Button>
      <Button onClick={onBackButtonClick} className='mt-2 mb-2'>Back</Button>

    </div>
  );
};

export default AnswerSpace;
