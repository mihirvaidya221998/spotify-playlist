import logo from './logo.svg';
import './App.css';
import uploadData from './uploadData'; // Ensure this is the correct path

function App() {
  
  // Function to handle the click event
  const handleUploadClick = () => {
    uploadData();
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        {/* Link or button to trigger data upload */}
        <button onClick={handleUploadClick}>Run Data Upload</button>
      </header>
    </div>
  );
}

export default App;
