import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
// components in curly brackets are named export
// no need to use curly brackets for default export
import DocumentDropzone from './components/DocumentDropzone';


/**
 * The top level functional component of this App
 */
function App() {
    return (
        <div className="App">

        <header className="App-header">
        <h1>DeepPhe-CR Demo App</h1>
        </header>

        <DocumentDropzone />

        </div>
    );
}


export default App;
