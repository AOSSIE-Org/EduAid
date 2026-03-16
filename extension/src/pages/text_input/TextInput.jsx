import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logo from "../../assets/aossie_logo.webp";
import stars from "../../assets/stars.png";
import cloud from "../../assets/cloud.png";
import arrow from "../../assets/arrow.png";
import { FaClipboard , FaWikipediaW  } from "react-icons/fa";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const OPENAI_HARDCODED_MODELS = [
  "gpt-4",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-5.1",
  "gpt-5.4",
];

function Second() {
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [fileContent, setFileContent] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [isToggleOn, setIsToggleOn] = useState(0);
  const [provider, setProvider] = useState("openai");
  const [useExternalLlm, setUseExternalLlm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [backendError, setBackendError] = useState("");
  const [backendInfo, setBackendInfo] = useState("");

  const getChromeStorage = (keys) =>
    new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });

  const setChromeStorage = (data) =>
    new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });

  const getPreferredModelForProvider = (providerName, models) => {
    if (!Array.isArray(models) || models.length === 0) {
      return "";
    }

    if (providerName === "openai") {
      const exact = models.find((m) => m === "gpt-4o-mini");
      if (exact) {
        return exact;
      }
    }

    if (providerName === "anthropic") {
      const exact = models.find((m) => m === "claude-sonnet-4-5");
      if (exact) {
        return exact;
      }
      const fuzzy = models.find((m) => {
        const id = String(m || "").toLowerCase();
        return id.includes("sonnet") && id.includes("4-5");
      });
      if (fuzzy) {
        return fuzzy;
      }
    }

    return models[0];
  };

  useEffect(() => {
    chrome.storage.local.get(["selectedText"], (result) => {
      if (result.selectedText) {
        console.log("Selected Text: ", result.selectedText);
        setText(result.selectedText);
        localStorage.setItem("textContent", result.selectedText);
      }
    });
  }, [])

  useEffect(() => {
    const loadLlmSettings = async () => {
      const stored = await getChromeStorage([
        "llmUseExternal",
        "llmProvider",
        "llmApiKey",
        "llmModel",
        "llmModelsByProvider",
      ]);

      setUseExternalLlm(Boolean(stored.llmUseExternal));
      const storedProvider = stored.llmProvider || "openai";
      setProvider(storedProvider);
      setApiKey(stored.llmApiKey || "");

      const modelsByProvider = stored.llmModelsByProvider || {};
      const providerModels =
        storedProvider === "openai"
          ? [...OPENAI_HARDCODED_MODELS]
          : modelsByProvider[storedProvider] || [];
      setModelOptions(providerModels);

      if (stored.llmModel && providerModels.includes(stored.llmModel)) {
        setSelectedModel(stored.llmModel);
      } else if (providerModels.length > 0) {
        setSelectedModel(getPreferredModelForProvider(storedProvider, providerModels));
      }
    };

    loadLlmSettings();
  }, []);


  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setText(data.content || data.error);
      } catch (error) {
        console.error('Error uploading file:', error);
        setText('Error uploading file');
      }
    }
  };

  const handleClick = (event) => {
    event.preventDefault();  // Prevent default behavior
    event.stopPropagation(); // Stop event propagation

    // Open file input dialog
    fileInputRef.current.click();
  };

  const handleProviderChange = async (event) => {
    const nextProvider = event.target.value;
    setProvider(nextProvider);
    setModelError("");

    const stored = await getChromeStorage(["llmModelsByProvider", "llmModel"]);
    const modelsByProvider = stored.llmModelsByProvider || {};
    const providerModels =
      nextProvider === "openai"
        ? [...OPENAI_HARDCODED_MODELS]
        : modelsByProvider[nextProvider] || [];
    setModelOptions(providerModels);
    const defaultModel = getPreferredModelForProvider(nextProvider, providerModels);
    setSelectedModel(defaultModel);

    await setChromeStorage({
      llmProvider: nextProvider,
      llmModel: defaultModel,
    });
  };

  const handleFetchModels = async () => {
    if (!apiKey.trim()) {
      setModelError("Please enter an API key first.");
      return;
    }

    setModelLoading(true);
    setModelError("");

    try {
      let modelIds = [];

      if (provider === "openai") {
        modelIds = [...OPENAI_HARDCODED_MODELS];
      } else {
        const anthropic = new Anthropic({
          apiKey: apiKey.trim(),
          dangerouslyAllowBrowser: true,
        });
        const response = await anthropic.models.list();
        if (response && Symbol.asyncIterator in response) {
          for await (const model of response) {
            if (model?.id) {
              modelIds.push(model.id);
            }
          }
        } else {
          modelIds = (response?.data || [])
            .map((model) => model?.id)
            .filter(Boolean);
        }
      }

      const uniqueSortedModels = Array.from(new Set(modelIds)).sort((a, b) =>
        a.localeCompare(b)
      );

      if (uniqueSortedModels.length === 0) {
        setModelError("No models found for this account.");
        setModelOptions([]);
        setSelectedModel("");
        return;
      }

      setModelOptions(uniqueSortedModels);
      const previous = selectedModel;
      const nextModel =
        previous && uniqueSortedModels.includes(previous)
          ? previous
          : getPreferredModelForProvider(provider, uniqueSortedModels);
      setSelectedModel(nextModel);

      const stored = await getChromeStorage(["llmModelsByProvider"]);
      const modelsByProvider = stored.llmModelsByProvider || {};
      modelsByProvider[provider] = uniqueSortedModels;

      await setChromeStorage({
        llmUseExternal: useExternalLlm,
        llmProvider: provider,
        llmApiKey: apiKey.trim(),
        llmModel: nextModel,
        llmModelsByProvider: modelsByProvider,
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      setModelError("Could not fetch models. Please check provider and API key.");
      setModelOptions([]);
      setSelectedModel("");
    } finally {
      setModelLoading(false);
    }
  };

  const handleSaveToLocalStorage = async () => {
    setLoading(true);
    setBackendError("");
    setBackendInfo("");
    const hasExternalConfig = Boolean(useExternalLlm && apiKey.trim() && selectedModel);

    if (useExternalLlm && !hasExternalConfig) {
      setBackendInfo("External config incomplete - falling back to local generation.");
    }

    await setChromeStorage({
      llmUseExternal: useExternalLlm,
      llmProvider: provider,
      llmApiKey: apiKey.trim(),
      llmModel: selectedModel,
    });

    // Check if a Google Doc URL is provided
    if (docUrl) {
      try {
        const response = await fetch('http://localhost:5000/get_content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ document_url: docUrl })
        });

        if (response.ok) {
          const data = await response.json();
          setDocUrl("")
          setText(data || "Error in retrieving");
        } else {
          console.error('Error retrieving Google Doc content');
          setText('Error retrieving Google Doc content');
        }
      } catch (error) {
        console.error('Error:', error);
        setText('Error retrieving Google Doc content');
      } finally {
        setLoading(false);
        chrome.storage.local.remove(["selectedText"], () => {
          console.log("Chrome storage cleared");
        });
      }
    } else if (text) {
      // Proceed with existing functionality for local storage
      localStorage.setItem("textContent", text);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem("selectedQuestionType"),
        hasExternalConfig
      );
    }
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  const incrementQuestions = () => {
    setNumQuestions((prev) => prev + 1);
  };

  const decrementQuestions = () => {
    setNumQuestions((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const getEndpoint = (difficulty, questionType) => {
    // External providers are currently implemented on base endpoints.
    if (useExternalLlm) {
      return questionType;
    }
    if (difficulty !== "Easy Difficulty") {
      if (questionType === "get_shortq") {
        return "get_shortq_hard";
      } else if (questionType === "get_mcq") {
        return "get_mcq_hard";
      }
    }
    return questionType;
  };

  const sendToBackend = async (data, difficulty, questionType, hasExternalConfig = false) => {
    const endpoint = getEndpoint(difficulty, questionType);
    try {
      const payload = {
        input_text: data,
        max_questions: numQuestions,
        use_mediawiki: isToggleOn,
      };

      if (questionType === "get_problems") {
        payload.max_questions_mcq = numQuestions;
        payload.max_questions_boolq = numQuestions;
        payload.max_questions_shortq = numQuestions;
      }

      if (hasExternalConfig) {
        payload.llm_provider = provider;
        payload.llm_model = selectedModel;
        payload.llm_api_key = apiKey.trim();
      }

      const formData = JSON.stringify(payload);
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("qaPairs", JSON.stringify(responseData));

        // Save quiz details to local storage
        const quizDetails = {
          difficulty,
          numQuestions,
          date: new Date().toLocaleDateString(),
          qaPair: responseData
        };

        let last5Quizzes = JSON.parse(localStorage.getItem('last5Quizzes')) || [];
        last5Quizzes.push(quizDetails);
        if (last5Quizzes.length > 5) {
          last5Quizzes.shift();  // Keep only the last 5 quizzes
        }
        localStorage.setItem('last5Quizzes', JSON.stringify(last5Quizzes));

        window.location.href = "/src/pages/question/question.html";
      } else {
        let errorMessage = "Backend request failed.";
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Keep generic message when response body is not JSON.
        }
        setBackendError(errorMessage);
        console.error(errorMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      setBackendError("Could not reach backend. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="popup w-42rem h-35rem bg-[#02000F] flex justify-center items-center">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      <div
        className={`w-full h-full bg-cust bg-opacity-50 bg-custom-gradient ${loading ? "pointer-events-none" : ""
          }`}
      >
        <div className="flex items-end gap-[2px]">
          <img src={logo} alt="logo" className="w-16 my-4 ml-4 block" />
          <div className="text-2xl mb-3 font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
        </div>
        <div className="text-right mt-[-8px] mx-1">
          <div className="text-white text-sm font-bold">Enter the Content</div>
          <div className="text-white text-right justify-end flex gap-2 text-sm font-bold">
            to Generate{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Questionaries
            </span>{" "}
            <img className="h-[20px] w-[20px]" src={stars} alt="stars" />
          </div>
        </div>
        <div className="text-left mx-2 mb-1 mt-1 text-sm text-white">
          Enter Content Here
        </div>

        <div className="relative bg-[#83b6cc40] mx-3 rounded-xl p-2 h-28">
          <button className="absolute top-0 left-0 p-2 text-white focus:outline-none">
            <FaClipboard className="h-[20px] w-[20px]" />
          </button>
          <textarea
            className="absolute inset-0 p-8 pt-2 bg-[#83b6cc40] text-lg rounded-xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <style>
            {`
          textarea::-webkit-scrollbar {
            display: none;
          }
        `}
          </style>
        </div>
        <div className="text-white text-center my-2 text-sm">or</div>
        <div className="border-[3px] rounded-xl text-center mx-3 px-6 py-2 border-dotted border-[#3E5063] mt-4">
          <img className="mx-auto" height={24} width={24} src={cloud} alt="cloud" />
          <div className="text-center text-white text-sm">Choose a file</div>
          <div className="text-center text-white text-sm">
            PDF, MP3 supported
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              className="bg-[#3e506380] my-2 text-sm rounded-xl text-white border border-[#cbd0dc80] px-6 py-1"
              onClick={handleClick}
            >
              Browse File
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter Google Doc URL"
            className="bg-[#202838] text-white rounded-xl px-5 py-2"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
        </div>
        <div className="mx-3 mt-3 rounded-xl border border-[#3E5063] p-3 bg-[#202838] bg-opacity-60">
          <div className="text-white text-sm font-semibold mb-2">LLM Provider Settings</div>
          <div className="mb-2">
            <label className="text-white text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={useExternalLlm}
                onChange={(e) => setUseExternalLlm(e.target.checked)}
              />
              Use external provider API (OpenAI / Anthropic)
            </label>
          </div>
          {!useExternalLlm && (
            <div className="text-[#AFC2D4] text-xs mb-2">
              Local/default generation is active. Enable the checkbox to use provider models.
            </div>
          )}
          {useExternalLlm && (
            <>
          <div className="flex gap-2 mb-2">
            <select
              value={provider}
              onChange={handleProviderChange}
              className="bg-[#101522] text-white rounded-xl px-3 py-2"
            >
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
            </select>
            <input
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-[#101522] text-white rounded-xl px-3 py-2"
            />
          </div>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={modelLoading}
              className="bg-[#3e506380] text-sm rounded-xl text-white border border-[#cbd0dc80] px-4 py-2 disabled:opacity-60"
            >
              {modelLoading ? "Loading models..." : "Load Models"}
            </button>
            <select
              value={selectedModel}
              onChange={async (e) => {
                const previousModel = selectedModel;
                const model = e.target.value;
                setSelectedModel(model);
                try {
                  await setChromeStorage({ llmModel: model });
                } catch (err) {
                  setSelectedModel(previousModel);
                  setBackendError("Failed to save model selection. Please try again.");
                }
              }}
              disabled={modelOptions.length === 0}
              className="flex-1 bg-[#101522] text-white rounded-xl px-3 py-2 disabled:opacity-60"
            >
              {modelOptions.length === 0 ? (
                <option value="">No models loaded</option>
              ) : (
                modelOptions.map((modelId) => (
                  <option key={modelId} value={modelId}>
                    {modelId}
                  </option>
                ))
              )}
            </select>
          </div>
            </>
          )}
          {modelError && <div className="text-[#FF8A8A] text-xs">{modelError}</div>}
          {backendInfo && <div className="text-[#F6E7A8] text-xs mt-1">{backendInfo}</div>}
          {backendError && <div className="text-[#FF8A8A] text-xs mt-1">{backendError}</div>}
        </div>
        <div className="flex justify-center gap-1 p-2">
          <div className="relative items-center">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              disabled={useExternalLlm}
              className="bg-[#202838] text-white rounded-xl px-5 py-3 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option>Easy Difficulty</option>
              <option>Medium Difficulty</option>
              <option>Hard Difficulty</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center py-2 px-2 pointer-events-none">
              <svg
                className="w-2 h-2 fill-current text-white"
                viewBox="0 0 20 20"
              >
                <path d="M5.5 8l4.5 4.5L14.5 8H5.5z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center bg-[#202838] text-white rounded-xl px-1 py-2">
            <span className="">
              No. of questions{" "}
              <button
                onClick={decrementQuestions}
                className="mr-1 px-1 rounded-full bg-[#3C5063] hover:bg-[#2d3c4b]"
              >
                -
              </button>{" "}
              {numQuestions}{" "}
            </span>
            <button
              onClick={incrementQuestions}
              className="ml-1 px-1 rounded-full bg-[#3C5063] hover:bg-[#2d3c4b]"
            >
              +
            </button>
          </div>
          <div className="items-center bg-[#202838] text-white rounded-xl px-2 py-2">
           <button
            title={isToggleOn ? "Disable Wikipedia Context" : "Enable Wikipedia Context"}
            onClick={toggleSwitch}
            className={`p-1 rounded-md transition 
              ${isToggleOn ? "bg-green-500 text-white" : "bg-gray-400 text-gray-300"}
            `}
          >
            <FaWikipediaW className="text-2xl" />
          </button>
          </div>
        </div>
        <div className="flex my-2 justify-center gap-6 items-start">
          <div className="">
            <a href="/src/popup/popup.html">
              <button className="bg-black items-center text-sm text-white px-4 py-2 mx-auto border-gradient">
                Back
              </button>
            </a>
          </div>
          <div>
            <button
              onClick={handleSaveToLocalStorage}
              className="bg-black items-center text-sm text-white px-4 py-2 mx-auto border-gradient flex"
            >
              Next <img src={arrow} width={16} height={12} alt="arrow" className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<Second />, document.getElementById("root"));

