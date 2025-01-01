import React from 'react'
import { Route,BrowserRouter,Routes } from 'react-router-dom'

import Login from '../screens/Login'
import Register from '../screens/Register'
import Question_Type from '../pages/Question_Type'
import Text_Input from '../pages/Text_Input'
import Output from '../pages/Output'
import Previous from '../pages/Previous'
import Home from '../pages/Home'
function Approutes() {
  return (
    <BrowserRouter>
    <Routes>
        <Route path='/' element={<Home/>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/register' element={<Register/>}></Route>
        <Route path="/question-type" element={<Question_Type/>} />
        <Route path="/input" element={<Text_Input/>} />
        <Route path="/output" element={<Output />} />
        <Route path="/history" element={<Previous />} />
    </Routes>
    
    
    </BrowserRouter>
  )
}

export default Approutes