import React, { useState, useRef } from 'react'
import '../index.css'
import logo from '../assets/aossie_logo.png'
import stars from '../assets/stars.png'
import cloud from '../assets/cloud.png'
import { FaClipboard } from 'react-icons/fa'
import Switch from 'react-switch'

const Text_Input = () => {
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('Easy Difficulty')
  const [numQuestions, setNumQuestions] = useState(10)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [fileContent, setFileContent] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [isToggleOn, setIsToggleOn] = useState(0)

  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        setText(data.content || data.error)
      } catch (error) {
        console.error('Error uploading file:', error)
        setText('Error uploading file')
      }
    }
  }

  const handleClick = (event) => {
    event.preventDefault() // Prevent default behavior
    event.stopPropagation() // Stop event propagation

    // Open file input dialog
    fileInputRef.current.click()
  }

  const handleSaveToLocalStorage = async () => {
    setLoading(true)

    // Check if a Google Doc URL is provided
    if (docUrl) {
      try {
        const response = await fetch('http://localhost:5000/get_content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ document_url: docUrl }),
        })

        if (response.ok) {
          const data = await response.json()
          setDocUrl('')
          setText(data || 'Error in retrieving')
        } else {
          console.error('Error retrieving Google Doc content')
          setText('Error retrieving Google Doc content')
        }
      } catch (error) {
        console.error('Error:', error)
        setText('Error retrieving Google Doc content')
      } finally {
        setLoading(false)
      }
    } else if (text) {
      // Proceed with existing functionality for local storage
      localStorage.setItem('textContent', text)
      localStorage.setItem('difficulty', difficulty)
      localStorage.setItem('numQuestions', numQuestions)

      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem('selectedQuestionType')
      )
    }
  }

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value)
  }

  const incrementQuestions = () => {
    setNumQuestions((prev) => prev + 1)
  }

  const decrementQuestions = () => {
    setNumQuestions((prev) => (prev > 0 ? prev - 1 : 0))
  }

  const getEndpoint = (difficulty, questionType) => {
    if (difficulty !== 'Easy Difficulty') {
      if (questionType === 'get_shortq') {
        return 'get_shortq_hard'
      } else if (questionType === 'get_mcq') {
        return 'get_mcq_hard'
      }
    }
    return questionType
  }

  const sendToBackend = async (data, difficulty, questionType) => {
    const endpoint = getEndpoint(difficulty, questionType)
    try {
      const formData = JSON.stringify({
        input_text: data,
        max_questions: numQuestions,
        use_mediawiki: isToggleOn,
      })

      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const responseData = await response.json()
        localStorage.setItem('qaPairs', JSON.stringify(responseData))

        // Save quiz details to local storage
        const quizDetails = {
          difficulty,
          numQuestions,
          date: new Date().toLocaleDateString(),
          qaPair: responseData,
        }

        let last5Quizzes =
          JSON.parse(localStorage.getItem('last5Quizzes')) || []
        last5Quizzes.push(quizDetails)
        if (last5Quizzes.length > 5) {
          last5Quizzes.shift() // Keep only the last 5 quizzes
        }
        localStorage.setItem('last5Quizzes', JSON.stringify(last5Quizzes))

        window.location.href = 'output'
      } else {
        console.error('Backend request failed.')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      <div
        className={`w-full h-full bg-cust bg-opacity-50 ${
          loading ? 'pointer-events-none' : ''
        }`}
      >
        <a href="/">
          <div className="flex items-end gap-[2px]">
            <img src={logo} alt="logo" className="w-24 my-6 ml-6 block" />
            <div className="text-4xl mb-5 font-extrabold">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                Edu
              </span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                Aid
              </span>
            </div>
          </div>
        </a>
        <div className="text-right mt-[-8px] mx-1">
          <div className="text-white text-xl font-bold">Enter the Content</div>
          <div className="text-white text-right justify-end flex gap-2 text-xl font-bold">
            to Generate{' '}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Questionaries
            </span>{' '}
            <img className="h-[30px] w-[30px]" src={stars} alt="stars" />
          </div>
        </div>

        <div className="relative bg-[#83b6cc40] mx-6 rounded-2xl p-4 h-40">
          <button className="absolute top-0 left-0 p-2 text-white focus:outline-none">
            <FaClipboard className="h-[24px] w-[24px]" />
          </button>
          <textarea
            className="absolute inset-0 p-8 pt-4 bg-[#83b6cc40] text-xl rounded-2xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
        <div className="text-white text-center my-4 text-lg">or</div>
        <div className="border-[3px] rounded-2xl text-center mx-6 px-6 py-4 border-dotted border-[#3E5063] mt-6">
          <img
            className="mx-auto"
            height={32}
            width={32}
            src={cloud}
            alt="cloud"
          />
          <div className="text-center text-white text-lg">Choose a file</div>
          <div className="text-center text-white text-lg">
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
              className="bg-[#3e506380] my-4 text-lg rounded-2xl text-white border border-[#cbd0dc80] px-6 py-2"
              onClick={handleClick}
            >
              Browse File
            </button>
          </div>

          <input
            type="text"
            placeholder="Enter Google Doc URL"
            className="bg-transparent border border-[#cbd0dc80] text-white text-xl rounded-2xl p-3 w-fit outline-none"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
        </div>

        <div className="flex justify-center gap-8 items-center">
          <div className="flex gap-2 items-center">
            <div className="text-white text-xl font-bold">
              No. of Questions:{' '}
            </div>
            <button
              onClick={decrementQuestions}
              className="rounded-lg border-[3px] border-[#6e8a9f] text-white text-xl px-3"
            >
              -
            </button>
            <span className="text-white text-2xl">{numQuestions}</span>
            <button
              onClick={incrementQuestions}
              className="rounded-lg border-[3px] border-[#6e8a9f] text-white text-xl px-2"
            >
              +
            </button>
          </div>
          <div className="text-center mt-2 mb-2">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-[#3e5063] text-white text-lg rounded-xl p-2 outline-none"
            >
              <option value="Easy Difficulty">Easy Difficulty</option>
              <option value="Hard Difficulty">Hard Difficulty</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="text-white text-xl font-bold">Use Wikipedia: </div>
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
        <div className="flex justify-center gap-8 my-6">
          <a href="question-type">
            <button className="bg-black items-center text-xl text-white px-4 py-2 border-gradient">
              Back
            </button>
          </a>
          {/* <a href="output"> */}
          <button
            onClick={handleSaveToLocalStorage}
            className="bg-black items-center text-xl text-white px-4 py-2 border-gradient flex"
          >
            Next
          </button>
          {/* </a> */}
        </div>
      </div>
    </div>
  )
}

export default Text_Input
