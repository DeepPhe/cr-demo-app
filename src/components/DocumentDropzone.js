// useState is a Hook that lets you add React state to function components
import React, {useState, useEffect} from "react";
import {useDropzone} from 'react-dropzone';

// Local
//import DocumentSubmit from './DocumentSubmit';


// Function component
function DocumentDropzone(props) {
    // Declare a new state variable `files` with an empty array as initial state
    // It returns a pair of values: the current state and a function that updates it
    const [files, setFiles] = useState([]);

    const [result, setResult] = useState('');
    const [error, setError] = useState('');

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
            console.log(acceptedFiles)

            acceptedFiles.forEach(file => {
                // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
                // no arguments
                const reader = new FileReader()

                reader.onabort = () => console.log('file reading was aborted')
                reader.onerror = () => console.log('file reading has failed')
                reader.onload = () => {
                    // Do whatever you want with the file contents
                    const binaryStr = reader.result
                    console.log(binaryStr)

                    // Add new property `preview` to each file object
                    file.preview = binaryStr
                }

                // Note, this readAsText() returns None (undefined).
                reader.readAsText(file);
            })

            // Update the state variable `files` using the `acceptedFiles` information 
            setFiles(acceptedFiles)
        }
    });

    // Fetch data from backend API
    function summarizeDocument() {
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

        console.log(result)
        console.log(error)
    }

    // Add `key`` property to avoid: Warning: Each child in a list should have a unique "key" prop
    // Use <pre> to preserve the original preformatted text, 
    // in which structure is represented by typographic conventions rather than by elements.
    const DocumentPreview = files.map(file => (
        <div key={file.name} className="doc-preview">
        <header className="doc-preview-header">
        <span className="text-primary file-info">{file.name}, {file.size}</span>
        <button type="submit" className="btn btn-primary" onClick={summarizeDocument}>Submit</button>
        </header>

        <div className="doc-preview-content">
        <pre>{file.preview}</pre>
        </div>
        </div>
    ));

    // Use <code> rather than <pre> to format
    const summarizedDocument = (
        <div className="summarized-doc">
        <code>{result}</code>
        </div>
    );

    // The spread syntax is denoted by three dots
    return (
        <div>
        <div {...getRootProps()} className="drop-zone">
        <input {...getInputProps()} />
        <p>Click to select patient note</p>
        </div>

        <div>
        {DocumentPreview}
        </div>

        <div>
        {summarizedDocument}
        </div>

        </div>
    )
}


export default DocumentDropzone;