import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import logo from './logo.svg';
//Pages
import './App.css';
import uploadData from './uploadData';
import Playlists from './playlists';
import Users from './user';
import Visualizations from './visualization'


function Home() {

  const navigate = useNavigate();
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>Welcome to Spotify Generator, where you can create custom spotify playlists.</p>
      <button onClick={() => navigate('/playlists')}>Data Page</button>
      <button onClick={() => navigate('/visualization')}>Show Visualizations</button>
      <button onClick={() => navigate('/upload')}>Upload Data Page (from csv)</button>
    </header>
  );
}

function Upload() {
  const navigate = useNavigate();
  // Function to handle the click event
  const handleUploadClick = () => {
    uploadData();
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={handleUploadClick}>Run Data Upload</button>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/playlists" element={<Playlists />}/>
        <Route path='/:userID' element={<Users/>}/>
        <Route path='/visualization' element={<Visualizations/>}/>
      </Routes>
    </Router>
  );
}

export default App;
