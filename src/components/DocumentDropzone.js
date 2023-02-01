// components in curly brackets are named export
// no need to use curly brackets for default export
import {useState} from "react";
import axios from 'axios';
import {useDropzone} from 'react-dropzone';
import {ThreeDots} from 'react-loader-spinner';
import {trackPromise, usePromiseTracker} from 'react-promise-tracker';

// config data
import config from "../config/config.json";


// Extract information from summarized json for rendering
function getExtractedInfo(dataObj) {
    console.log("======Input: dataObj======");
    console.log(dataObj);

    let infoObj = {
        'topography': '',
        'histology': '',
        'behavior': '',
        'laterality': '',
        'grade': ''
    };

    dataObj.neoplasms[0].attributes.forEach(item => {
        if (item.name === 'topography') {
            infoObj.topography = item.value;
        }

        if (item.name === 'histology') {
            infoObj.histology = item.value;
        }

        if (item.name === 'behavior') {
            infoObj.behavior = item.value;
        }

        if (item.name === 'laterality') {
            infoObj.laterality = item.value;
        }

        if (item.name === 'grade') {
            infoObj.grade = item.value;
        }
    });

    console.log("======Output: infoObj======");
    console.log(infoObj);

    return infoObj;
}


/**
 * This function is a valid React component because it accepts a single “props” (which stands for properties) 
 * object argument with data and returns a React element. We call such components "function components" 
 * because they are literally JavaScript functions.
 *
 * @param {object} props The properties object as input to a React component
 */
function DocumentDropzone(props) {
    // State variables with initial state
    // It returns a pair of values: the current state and a function that updates it
    const [doc, setDoc] = useState({}); // Empty object as initial state
    const [result, setResult] = useState({}); // Empty object as initial state
    const [error, setError] = useState({}); // Empty object as initial state

    // Function component of the spinner
    const Spinner = props => {
        const { promiseInProgress } = usePromiseTracker();

        return (
            <span className="spinner">
            {promiseInProgress && 
            <ThreeDots 
            height="40" 
            width="100" 
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
            // Reset the extraction summary result on each new file selection
            setResult('');
            setError('');

            // `acceptedFiles` is an array and stores the details of each accepted file
            console.log("======acceptedFiles======");
            console.log(acceptedFiles);

            // We only handle one file
            let file = acceptedFiles[0];

            // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
            // no arguments
            const reader = new FileReader();

            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            reader.onload = () => {
                // Do whatever you want with the file contents
                const binaryStr = reader.result;

                console.log("======binaryStr======");
                console.log(binaryStr);

                // Add new property `preview` to each file object
                file.preview = binaryStr;
            }

            // Note, this readAsText() returns None (undefined).
            reader.readAsText(file);

            // Update the state variable `doc` using the `file` information 
            setDoc(file);
        }
    });

    // Submit button handler
    // Fetch data from backend API and store the text to react state variable
    function summarizeDocument() {
        console.log("Executing summarizeDocument()...");

        const requestConfig = {
            'headers': {
                'Content-Type': 'text/plain',
                'Authorization': 'Bearer ' + config.auth_token
            }
        };

        trackPromise(
            axios.put(config.api_base_url + "summarizeOneDoc/doc/1", doc.preview, requestConfig)
            .then(
                (res) => {
                    console.log("======API call response: res======");
                    console.log(res)

                    // `data` is an object here
                    setResult(res.data);
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (err) => {
                    console.log("======API call err: err======");
                    setError(err);
                }
            )
            .catch(err => console.log(err))
        );
    }

    
    // Add `key` property to avoid: Warning: Each child in a list should have a unique "key" prop
    // Use <pre> to preserve the original preformatted text, 
    // in which structure is represented by typographic conventions rather than by elements.
    function documentPreview() {
        console.log("Executing documentPreview()...");

        if (Object.keys(doc).length > 0) {
            return (
                <div key={doc.name} className="doc-preview">

                <header className="doc-header">
                <span className="text-primary doc-info">{doc.name}</span>
                <button type="submit" className="btn btn-primary" onClick={summarizeDocument}>Summarize</button> 
                <Spinner />
                </header>

                <pre className="doc-content">{doc.preview}</pre>

                </div>
            )
        }
    }

    // Show the extracted info along with json payload of summarized doc or error message or nothing
    // `result` is json object
    function summarizedDocument() {
        console.log("Executing summarizedDocument()...");
        
        // Show error message as long as the `error` is not empty object\
        // Show summaried doc as long as the `result` is not empty object
        if (Object.keys(error).length > 0) {
            return (<div className="alert alert-danger">{error.message}</div>);
        } else if (Object.keys(result).length > 0) {
            let info = getExtractedInfo(result);

            return (
                <div className="doc-summary">

                <header className="doc-header">
                <span className="text-primary doc-info">Review Document Summary</span>
                </header>
                
                <div className="extracted-info">
                <p>Extracted Info</p>
                <ul>
                <li>Topography: <span>{info.topography}</span></li>
                <li>Histology: <span>{info.histology}</span></li>
                <li>Behavior: <span>{info.behavior}</span></li>
                <li>Laterality: <span>{info.laterality}</span></li>
                <li>Grade: <span>{info.grade}</span></li>
                </ul>
                </div>

                {/* Use <code> to wrap <pre> to highlight the preformatted result */}
                <code><pre className="doc-content">{JSON.stringify(result, null, 2)}</pre></code>

                </div>
            );
        } else {
            // Render nothing
            return null;
        }
    }

    // Final return of this DocumentDropzone (functional component)
    return (
        <div>

        {/* The spread syntax is denoted by three dots */}
        <div {...getRootProps()} className="drop-zone">
        <input {...getInputProps()} />
        <p className="btn btn-primary">Click to select patient note</p>
        </div>

        <div>
        {documentPreview()}
        </div>

        <div>
        {/* A function can be defined and used by the expression, remember to add () */}
        {summarizedDocument()}
        </div>

        </div>
    )
}


export default DocumentDropzone;