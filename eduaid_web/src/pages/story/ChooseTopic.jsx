import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, ChevronRight, Upload, BookText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../utils/apiClient';

export default function ChooseTopic() {

  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [topicText, setTopicText] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');

  const navigate = useNavigate();


  // ✅ CLEAN TEXT
  const cleanText = (text) => {
    return text
      .replace(/[^\w\s.,?!:;'"\-()]/g, '') // preserve common punctuation
      .replace(/\s+/g, ' ')
      .trim();
  };


  // ✅ GENERATE STORY using backend API
  const handleGenerateStory = async (text) => {

    setLoading(true);

    try {
      const requestData = {
        input_text: text,
        language: language,
        use_mediawiki: 0
      };

      // Use the dedicated story generation endpoint
      const responseData = await apiClient.post('/generate_story', requestData);
      
      if (responseData && responseData.story) {
        const cleaned = cleanText(responseData.story);
        setStory(cleaned);
      } else {
        alert('Failed to generate story. Please try again.');
      }

    } catch (err) {
      console.error(err);
      alert('Story generation failed. Please ensure the backend server is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };


  // ✅ TEXT SUBMIT
  const handleTextSubmit = () => {

    if (!topicText.trim()) return;

    handleGenerateStory(topicText.trim());
  };


  // ✅ PDF UPLOAD
  const handleUploadPdf = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.postFormData('/upload', formData);

      const extractedText = response?.content || '';

      setTopicText(extractedText);

      if (extractedText) {

        await handleGenerateStory(extractedText);

      } else {

        alert('No text found in PDF');

      }

    } catch (err) {

      console.error(err);
      alert('PDF upload failed');

    } finally {

      setLoading(false);

    }
  };


  // ✅ NEXT PAGE
  const handleProceed = () => {

    if (!story) return;

    navigate('/story', {
      state: { topic: topicText, story, language },
    });
  };


  return (

    <div className="bg-slate-900 min-h-screen">

      <div className="max-w-4xl mt-16 mx-auto px-4 py-10">


        {/* HEADER */}
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <h1 className="text-3xl font-bold text-blue-500">
            Topic Story Generator
          </h1>

        </motion.div>


        {/* LANGUAGE */}
        <div className="mb-6">

          <label className="text-white mr-3">
            Language:
          </label>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1 rounded"
          >

            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="hinglish">Hinglish</option>

          </select>

        </div>


        {/* TABS */}
        <div className="flex mb-6 border-b">

          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 ${
              activeTab === 'text'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400'
            }`}
          >

            <BookText className="inline mr-2 w-4 h-4" />
            Enter Topic

          </button>


          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 ${
              activeTab === 'upload'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400'
            }`}
          >

            <Upload className="inline mr-2 w-4 h-4" />
            Upload PDF

          </button>

        </div>


        {/* INPUT */}
        <AnimatePresence>

          {activeTab === 'text' ? (

            <motion.div>

              <textarea
                className="w-full p-4 rounded bg-white text-black"
                placeholder="Enter topic..."
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
              />


              <button
                onClick={handleTextSubmit}
                disabled={loading}
                className="mt-4 bg-blue-600 px-6 py-2 rounded text-white"
              >

                {loading ? 'Generating...' : 'Generate'}

              </button>

            </motion.div>

          ) : (

            <motion.div>

              <div className="p-6 border-dashed border-2 rounded text-center text-white">

                <Upload className="mx-auto mb-2" />

                <label className="cursor-pointer">

                  Upload PDF

                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={handleUploadPdf}
                  />

                </label>

              </div>

            </motion.div>

          )}

        </AnimatePresence>


        {/* OUTPUT */}
        {story && (

          <motion.div
            className="mt-8 p-6 bg-white rounded text-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >

            <h2 className="font-bold mb-3">
              Generated Story
            </h2>

            <p>{story}</p>


            <button
              onClick={handleProceed}
              className="mt-4 bg-blue-600 px-5 py-2 text-white rounded flex items-center gap-2 ml-auto"
            >

              Proceed
              <ChevronRight size={18} />

            </button>

          </motion.div>

        )}

      </div>

    </div>
  );
}
