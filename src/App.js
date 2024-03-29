import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
// components in curly brackets are named export
// no need to use curly brackets for default export
import Document from './components/Document';


/**
 * The top level functional component of this App
 */
function App() {
    return (
        <div className="app">

        <header className="app-header">
        <h1>DeepPhe-CR Demo App</h1>
        </header>

        <div className="app-content">
        <Document />
        </div>

        </div>
    );
}


export default App;
