import React, { useState, useRef } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import cloud from "../assets/cloud.png";
import { FaClipboard } from "react-icons/fa";
import Switch from "react-switch";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";


const Text_Input = () => {

  const navigate = useNavigate();


  const [text, setText] = useState("");

  const [difficulty, setDifficulty] = useState(
    "Easy Difficulty"
  );

  const [numQuestions, setNumQuestions] = useState(10);

  const [loading, setLoading] = useState(false);


  const fileInputRef = useRef(null);


  const [fileContent, setFileContent] = useState("");

  const [docUrl, setDocUrl] = useState("");

  const [isToggleOn, setIsToggleOn] = useState(0);



  // MediaWiki Toggle

  const toggleSwitch = () => {

    setIsToggleOn(
      (prev) => (prev + 1) % 2
    );

  };





  // Clear Complete Form

  const handleClearInput = () => {

    setText("");

    setDocUrl("");

    setFileContent("");

  };

// Paste from Clipboard

const handlePaste = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();

    setText(clipboardText);

  } catch (error) {

    console.error("Clipboard error:", error);

  }
};



  // Upload File

  const handleFileUpload = async (event) => {

    const file = event.target.files[0];


    if (file) {

      const formData = new FormData();

      formData.append(
        "file",
        file
      );


      try {


        const data = await apiClient.postFormData(
          "/upload",
          formData
        );


        setFileContent(file.name);

        setText(
          data.content || data.error
        );


      } catch (error) {


        console.error(
          "Error uploading file:",
          error
        );


        setText(
          "Error uploading file"
        );


      }


    }


  };





  const handleClick = (event) => {

    event.preventDefault();

    event.stopPropagation();


    fileInputRef.current.click();

  };





  const handleDifficultyChange = (e) => {

    setDifficulty(
      e.target.value
    );

  };





  const incrementQuestions = () => {

    setNumQuestions(
      (prev) => prev + 1
    );

  };





  const decrementQuestions = () => {

    setNumQuestions(
      (prev) => prev > 1 ? prev - 1 : 1
    );

  };
  const handleSaveToLocalStorage = async () => {

    setLoading(true);


    if (docUrl) {

      try {


        const data = await apiClient.post(
          "/get_content",
          {
            document_url: docUrl
          }
        );


        setDocUrl("");

        setText(
          data || "Error in retrieving"
        );


      } catch (error) {

        console.error(error);

        setText(
          "Error retrieving Google Doc content"
        );


      } finally {

        setLoading(false);

      }


    }

    else if (text) {


      localStorage.setItem(
        "textContent",
        text
      );


      localStorage.setItem(
        "difficulty",
        difficulty
      );


      localStorage.setItem(
        "numQuestions",
        numQuestions
      );


      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem("selectedQuestionType")
      );


    }


  };





  const getEndpoint = (
    difficulty,
    questionType
  ) => {


    if (difficulty !== "Easy Difficulty") {


      if (questionType === "get_shortq") {

        return "get_shortq_hard";

      }


      else if (questionType === "get_mcq") {

        return "get_mcq_hard";

      }


    }


    return questionType;


  };





  const sendToBackend = async (
    data,
    difficulty,
    questionType
  ) => {


    const endpoint = getEndpoint(
      difficulty,
      questionType
    );


    try {


      const requestData = {

        input_text: data,

        max_questions: numQuestions,

        use_mediawiki: isToggleOn,

      };



      const responseData =
        await apiClient.post(
          `/${endpoint}`,
          requestData
        );



      localStorage.setItem(
        "qaPairs",
        JSON.stringify(responseData)
      );



      navigate("/output");



    } catch (error) {

      console.error(
        "Error:",
        error
      );


    } finally {

      setLoading(false);

    }


  };





  return (

    <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">



      {loading && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">

          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>

        </div>

      )}



      <div className={`w-full h-full bg-cust bg-opacity-50 ${loading ? "pointer-events-none" : ""
        }`}>




        {/* Header */}


        <Link to="/" className="block">

          <div className="flex items-end gap-2 p-4">


            <img
              src={logo_trans}
              alt="logo"
              className="w-20 sm:w-24"
            />


            <div className="text-3xl sm:text-4xl font-extrabold">


              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                Edu
              </span>


              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                Aid
              </span>


            </div>


          </div>

        </Link>






        {/* Heading */}


        <div className="text-white text-center sm:text-right mx-4 sm:mx-8">


          <div className="text-xl sm:text-2xl font-bold">
            Enter the Content
          </div>


          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 text-xl font-bold">


            to Generate{" "}


            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Questionaries
            </span>


            <img
              className="h-6 w-6"
              src={stars}
              alt="stars"
            />


          </div>


        </div>






        {/* Text Area */}


        <div className="relative bg-[#83b6cc40] mx-4 sm:mx-8 rounded-2xl p-4 min-h-[160px] sm:min-h-[200px] mt-4">



        <button
  type="button"
  onClick={handlePaste}
  className="absolute top-2 left-2 p-2 text-white z-10"
  aria-label="Paste from clipboard"
>
  <FaClipboard className="h-[24px] w-[24px]" />
</button>





          <textarea

            className="absolute inset-0 p-8 pb-16 pt-6 bg-[#83b6cc40] text-lg sm:text-xl rounded-2xl outline-none resize-none h-full overflow-y-auto text-white caret-white"

            value={text}

            onChange={(e) => setText(e.target.value)}

          />





          <button

            type="button"

            onClick={handleClearInput}

            className="absolute bottom-3 right-3 bg-[#3e5063] text-white px-4 py-2 rounded-xl border border-[#cbd0dc80] hover:bg-[#526b82] transition"

          >

            Clear

          </button>



        </div>





        {/* Controls */}

        <div className="flex flex-wrap justify-center gap-5 mt-6 px-4 text-white">



          {/* Question Count */}


          <div className="flex items-center gap-3 bg-[#3e5063] rounded-xl px-4 py-2">


            <span>
              Questions:
            </span>


            <button
              type="button"
              onClick={decrementQuestions}
            >
              -
            </button>



            <span>
              {numQuestions}
            </span>



            <button
              type="button"
              onClick={incrementQuestions}
            >
              +
            </button>



          </div>





          {/* Difficulty */}


          <select

            value={difficulty}

            onChange={handleDifficultyChange}

            className="bg-[#3e5063] rounded-xl px-4 py-2 outline-none"

          >

            <option>
              Easy Difficulty
            </option>


            <option>
              Hard Difficulty
            </option>


          </select>





          {/* Wikipedia Toggle */}


          <div className="flex items-center gap-2">


            <span>
              Use Wikipedia:
            </span>


            <Switch

              onChange={toggleSwitch}

              checked={isToggleOn === 1}

              onColor="#008080"

              offColor="#3e5063"

              checkedIcon={false}

              uncheckedIcon={false}

            />


          </div>
        </div>





        <div className="text-white text-center my-4 text-lg">
          or
        </div>





        {/* File Upload */}

        <div className="w-full max-w-2xl mx-auto border-[3px] rounded-2xl text-center px-6 py-6 border-dotted border-[#3E5063] mt-6">



          <img

            className="mx-auto mb-2"

            height={32}

            width={32}

            src={cloud}

            alt="cloud"

          />



          <p className="text-white text-lg">

            Choose a file (PDF, MP3 supported)

          </p>





          <input

            type="file"

            ref={fileInputRef}

            onChange={handleFileUpload}

            style={{ display: "none" }}

          />





          <button

            type="button"

            className="bg-[#3e506380] my-4 text-lg rounded-2xl text-white border border-[#cbd0dc80] px-6 py-2"

            onClick={handleClick}

          >

            Browse File

          </button>





          {fileContent && (

            <p className="text-white text-sm">

              {fileContent}

            </p>

          )}

          <input

            type="text"

            placeholder="Enter Google Doc URL"

            className="bg-transparent mt-4 border border-[#cbd0dc80] text-white text-lg rounded-2xl px-4 py-2 w-full sm:w-2/3 outline-none"

            value={docUrl}

            onChange={(e) => setDocUrl(e.target.value)}

          />



        </div>







        {/* Buttons */}


        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 pb-10 px-4">





          <Link to="/question-type">


            <button

              type="button"

              className="bg-black text-white text-lg px-4 py-2 border-gradient rounded-xl w-full"

            >

              Back

            </button>


          </Link>







          <button


            type="button"


            onClick={handleSaveToLocalStorage}


            className="bg-black text-white text-lg px-4 py-2 border-gradient rounded-xl w-full"


          >

            Next

          </button>





        </div>





      </div>


    </div>


  );


};




export default Text_Input;