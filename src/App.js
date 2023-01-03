import logo from './logo.svg';
import './App.css';

import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>DeepPhe-CR Demo App</h1>
      </header>

      <div>
        <input type="file" name="file" />
        <div>
          <button>Process and Submit Document</button>
        </div>
      </div>

    </div>
  );
}

export default App;
