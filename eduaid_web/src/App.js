import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Question_Type from './pages/Question_Type'
import Text_Input from './pages/Text_Input'
import Output from './pages/Output'
import Previous from './pages/Previous'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question-type" element={<Question_Type />} />
        <Route path="/input" element={<Text_Input />} />
        <Route path="/output" element={<Output />} />
        <Route path="/history" element={<Previous />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
