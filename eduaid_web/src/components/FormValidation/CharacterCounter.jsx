import React from 'react';

const CharacterCounter = ({ text, maxLength = 2500 }) => {
  const count = text?.length || 0;
  const isNearLimit = count > maxLength * 0.8;
  const isOverLimit = count > maxLength;

  let textColor = "text-[#E4E4E4]";
  if (isOverLimit) {
    textColor = "text-red-500 font-bold";
  } else if (isNearLimit) {
    textColor = "text-yellow-500";
  }

  return (
    <div className={`text-xs text-right mt-1 transition-colors duration-300 ${textColor}`}>
      {count} / {maxLength} characters
      {isOverLimit && <span className="ml-2">Exceeds model capacity</span>}
    </div>
  );
};

export default CharacterCounter;