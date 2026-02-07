import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { TradingApp } from './pages/TradingApp';
import { Documentation } from './pages/Documentation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<TradingApp />} />
        <Route path="/docs" element={<Documentation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
