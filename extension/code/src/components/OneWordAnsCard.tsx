import { Label } from "@radix-ui/react-dropdown-menu";
import React from "react";

interface OneWordAnsCardProps {
  question: string;
  answer: string;
}

const OneWordAnsCard: React.FC<OneWordAnsCardProps> = ({
  question,
  answer,
}) => {
  return (
    <div className="grid gap-2 border w-full p-1 bg-card">
      <div className="bg-secondary rounded-md p-1">
        <Label className="text-muted-foreground">Question:</Label>
        <h3 className="ml-8">{question}</h3>
      </div>
      <div>
        <Label className="text-muted-foreground ">Answer:</Label>
        <p className="ml-8">{answer}</p>
      </div>
    </div>
  );
};

export default OneWordAnsCard;
