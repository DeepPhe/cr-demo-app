import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import DocumentDropzone from './components/DocumentDropzone';


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
