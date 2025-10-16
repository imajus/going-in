import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import CreateNFT from './pages/CreateNFT'
import MyNFTs from './pages/MyNFTs'
import Dashboard from './pages/Dashboard'
import ResellNFT from './pages/ResellNFT'
import './lib/appkit'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-nft" element={<CreateNFT />} />
          <Route path="/my-nfts" element={<MyNFTs />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resell-nft" element={<ResellNFT />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App