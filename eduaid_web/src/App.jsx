import React from 'react'
import Approutes from './routes/Approutes'
import { UserProvider } from './context/user.context'
function App() {
  return (
    <UserProvider>
<Approutes/>
    </UserProvider>
   
  )
}

export default App