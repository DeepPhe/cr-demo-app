// components in curly brackets are named export
// no need to use curly brackets for default export
import {useState} from "react";
import axios from 'axios';
import {useDropzone} from 'react-dropzone';
import {trackPromise} from 'react-promise-tracker';

// Local imports
import config from '../config/config.json';
import Spinner from './Spinner.js';
import {getExtractedInfo, highlightTextMentions} from './Utils.js';


/**
 * This function is a valid React component because it accepts a single `props` (which stands for properties) 
 * object argument with data and returns a React element. We call such components "function components" 
 * because they are literally JavaScript functions.
 *
 * @param {object} props The properties object as input to a React component
 */
function Document(props) {
    // State variables with initial state
    // It returns a pair of values: the current state and a function that updates it
    const [doc, setDoc] = useState({}); // Empty object as initial state
    const [docText, setDocText] = useState(''); // Empty string as initial state
    const [highlightedReportText, setHighlightedReportText] = useState(''); // Empty string as initial state
    const [result, setResult] = useState({}); // Empty object as initial state
    const [error, setError] = useState({}); // Empty object as initial state

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

                setDocText(binaryStr);

                // Add new property `preview` to each file object
                file.preview = binaryStr;

                console.log("======file.preview======");
                console.log(file.preview);
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

        // Reset the preview to remove any highlighted terms
        documentPreview(true);

        const requestHeaders = {
            'Content-Type': 'text/plain',
            'Authorization': 'Bearer ' + config.authToken
        };

        // Use file name as ID and remove file extension
        let docId = doc.name.split('.')[0].toLowerCase();

        trackPromise(
            // Config details: https://github.com/axios/axios#request-config
            axios({
                url: config.apiBaseUrl + "summarizeOneDoc/doc/" + docId,
                method: 'PUT',
                headers: requestHeaders,
                data: doc.preview
            })
            .then(
                (res) => {
                    console.log("======API call response: res======");
                    console.log(res)

                    // `data` is an object here
                    setResult(res.data);

                    console.log("======Pretty print======");
                    console.log(JSON.stringify(result, null, 2));
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
    function documentPreview(reset = false) {
        console.log("Executing documentPreview()...");

        if (reset) {
            console.log("Reset preview to the original doc text");
            console.log(docText)

            doc.preview = docText;
        } else {
            if (Object.keys(doc).length > 0) {
                return (
                    <div key={doc.name} className="doc-preview">

                    <header className="doc-header">
                    <span className="doc-info">{doc.name}</span>
                    <button type="submit" className="btn btn-primary btn-sm" onClick={summarizeDocument}>Summarize =></button> 
                    <Spinner />
                    </header>

                    <div className="doc-content">{doc.preview}</div>

                    </div>
                )
            }    
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
            
            const highlightText = (mentions, cssClass) => {
                console.log("Executing highlightText...");

                console.log("======mentions======");
                console.log(mentions);

                let highlightedDocText = highlightTextMentions(mentions, cssClass, docText);

                doc.preview = highlightedDocText;

                console.log("======highlightedDocText======");
                console.log(highlightedDocText);

                setHighlightedReportText(highlightedDocText);
            };

            return (
                <div className="doc-summary">

                <header className="doc-header">
                <span className="doc-info">Review Document Summary</span>
                </header>
                
                <div className="extracted-info">
                <ul className="list-group rounded-0">
                {info.topography.value !== '' &&
                    <li className="list-group-item">Topography: <span className="term topography-term" onClick={() => highlightText(info.topography.mentions, 'topography-term')}>{info.topography.value}</span><span className="term-count">({info.topography.mentions.length})</span></li>
                }

                {info.histology.value !== '' &&
                    <li className="list-group-item">Histology: <span className="term histology-term" onClick={() => highlightText(info.histology.mentions, 'histology-term')}>{info.histology.value}</span><span className="term-count">({info.histology.mentions.length})</span></li>
                }

                {info.behavior.value !== '' &&
                    <li className="list-group-item">Behavior: <span className="term behavior-term" onClick={() => highlightText(info.behavior.mentions, 'behavior-term')}>{info.behavior.value}</span><span className="term-count">({info.behavior.mentions.length})</span></li>
                }

                {info.laterality.value !== '' &&
                    <li className="list-group-item">Laterality: <span className="term laterality-term" onClick={() => highlightText(info.laterality.mentions, 'laterality-term')}>{info.laterality.value}</span><span className="term-count">({info.laterality.mentions.length})</span></li>
                }

                {info.grade.value !== '' &&
                    <li className="list-group-item">Grade: <span className="term grade-term" onClick={() => highlightText(info.grade.mentions, 'grade-term')}>{info.grade.value}</span><span className="term-count">({info.grade.mentions.length})</span></li>
                }
                </ul>

                <div className="json"><code>{JSON.stringify(result, null, 2)}</code></div>
                </div>
                
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

        <div className="container">
        <div className="row">
        <div className="col-8">
        {documentPreview()}
        </div>
        <div className="col">
        {/* A function can be defined and used by the expression, remember to add () */}
        {summarizedDocument()}
        </div>
        </div>
        </div>

        </div>
    )
}


export default Document;