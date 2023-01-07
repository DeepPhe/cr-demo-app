// components in curly brackets are named export
// no need to use curly brackets for default export
import {useState, useEffect} from "react";
import {useDropzone} from 'react-dropzone';
import {ThreeDots} from 'react-loader-spinner';
import { trackPromise, usePromiseTracker } from 'react-promise-tracker';


/**
 * This function is a valid React component because it accepts a single “props” (which stands for properties) 
 * object argument with data and returns a React element. We call such components "function components" 
 * because they are literally JavaScript functions.
 *
 * @param {object} props The properties object
 */
function DocumentDropzone(props) {
    // Declare a new state variable `files` with an empty array as initial state
    // It returns a pair of values: the current state and a function that updates it
    const [files, setFiles] = useState([]);

    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    // Function component of the spinner
    const Spinner = props => {
        const { promiseInProgress } = usePromiseTracker();

        return (
            <span className="spinner">
            {promiseInProgress && 
            <ThreeDots 
            height="80" 
            width="80" 
            radius="9"
            color="#4fa94d" 
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            wrapperClassName=""
            visible={true} />}
            </span>
        );
    };

    // const with curly brackets is object destructuring assignment from ES6 specifications
    // a shorthand way to initialize variables from object properties
    const {getRootProps, getInputProps} = useDropzone({
        // Single file mode
        multiple: false,
        noDrag: true,
        // Only accept text file
        accept: {
            'text/plain': ['.txt']
        },
        onDrop: acceptedFiles => {
            // Reset the extraction result on each new file selection
            setResult('');
            setError('');

            // `acceptedFiles` is an array and stores the details of each accepted
            console.log(acceptedFiles);

            acceptedFiles.forEach(file => {
                // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
                // no arguments
                const reader = new FileReader();

                reader.onabort = () => console.log('file reading was aborted');
                reader.onerror = () => console.log('file reading has failed');
                reader.onload = () => {
                    // Do whatever you want with the file contents
                    const binaryStr = reader.result;
                    console.log(binaryStr);

                    // Add new property `preview` to each file object
                    file.preview = binaryStr;
                }

                // Note, this readAsText() returns None (undefined).
                reader.readAsText(file);
            });

            // Update the state variable `files` using the `acceptedFiles` information 
            setFiles(acceptedFiles);
        }
    });

    // Submit button handler
    // Fetch data from backend API and store the text to react state variable
    function summarizeDocument() {
        trackPromise(
            fetch("https://entity.api.hubmapconsortium.org/entities/0de3181b777383b7b918d4402021fb34")
            .then(response => response.json())
            .then(
                (data) => {
                    // `data` is an object here, we need string
                    setResult(JSON.stringify(data));
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    setError(error);
                }
            )
        );

        console.log(result);
        console.log(error);
    }

    // Add `key` property to avoid: Warning: Each child in a list should have a unique "key" prop
    // Use <pre> to preserve the original preformatted text, 
    // in which structure is represented by typographic conventions rather than by elements.
    const DocumentPreview = files.map(file => (
        <div key={file.name} className="doc-preview">

        <header className="doc-preview-header">
        <span className="text-primary file-info">{file.name}, {file.size}</span>
        <button type="submit" className="btn btn-primary" onClick={summarizeDocument}>Summarize</button> 
        <Spinner />
        </header>

        <div className="doc-content">
        <pre>{file.preview}</pre>
        </div>

        </div>
    ));

    // Show the json payload of summarized doc or error message or nothing
    function summarizedDocument(text) {
        if (error) {
            return (<div className="summarized-doc">{error.message}</div>);
        } else if (result) {
            return (
                <div className="summarized-doc">

                <header className="doc-preview-header">
                <span className="text-primary file-info">Review Document Summary</span>
                </header>
                
                <div className="doc-content">
                {/* Use <code> rather than <pre> to format */}
                <code>{text}</code>
                </div>

                </div>
            );
        } else {
            // Render nothing
            return (null);
        }
    }

    // Final return of this DocumentDropzone (functional component)
    return (
        <div>

        {/* The spread syntax is denoted by three dots */}
        <div {...getRootProps()} className="drop-zone">
        <input {...getInputProps()} />
        <p>Click to select patient note</p>
        </div>

        <div>
        {DocumentPreview}
        </div>

        <div>
        {/* A function can be defined and use by the expression, remember to add () */}
        {summarizedDocument(result)}
        </div>

        </div>
    )
}


export default DocumentDropzone;