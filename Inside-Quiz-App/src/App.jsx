import './App.css'
import Home from './page/home/Home'
import Gameplay from './page/gamePlay/GamePlay'
import LeaderBoardHome from './page/leaderBoardHome/LeaderBoardHome'
import Shop from './page/shop/Shop'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router basename="/QuizInsideBuild">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<LeaderBoardHome />} />
        <Route path="/gameplay" element={<Gameplay />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </Router>
  )
}

export default App
