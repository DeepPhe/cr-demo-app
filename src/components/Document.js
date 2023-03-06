// components in curly brackets are named export
// no need to use curly brackets for default export
import {useState, useEffect} from "react";
import axios from 'axios';
import {useDropzone} from 'react-dropzone';
import {trackPromise} from 'react-promise-tracker';

// Local imports
import config from '../config/config.json';
import Spinner from './Spinner.js';
import {variablesObj} from './Variables.js';
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
    
    // Variables and their checkboxes
    const variableNamesArr = Object.keys(variablesObj);
    const [checkedVariables, setCheckedVariables] = useState(new Array(variableNamesArr.length).fill(false));

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
                    // console.log("======API call response: res======");
                    // console.log(res)

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
    function documentPreview() {
        console.log("Executing documentPreview()...");

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

    // Show multi highlighting after the DOM has been updated based on the `checkedVariables` dependency
    useEffect(() => {
        console.log("======checkedVariables======");
        console.log(checkedVariables);
        
        // Need this if check otherwise error on initial load when `result` is an empty Object
        if (Object.keys(result).length > 0) {
            multiHighlighting();
        }
    }, [checkedVariables]);

    // Highlight the target text mentions in report text
    function multiHighlighting() {
        console.log("Executing multiHighlighting()");

        // Always reset to empty
        let allTextMentions = [];

        let info = getExtractedInfo(result);

        // Build the array of all mentions based on checked variables
        // Merge into a big array using the spread operator ...
        checkedVariables.forEach((checkedVariable, index) => {
            if (checkedVariable) {
                allTextMentions = [...allTextMentions, ...info[variableNamesArr[index]].mentions];
            }
        });

        console.log("======allTextMentions======");
        console.log(allTextMentions);

        if (allTextMentions.length > 0) {
            let highlightedDocText = highlightTextMentions(allTextMentions, docText);
            doc.preview = highlightedDocText;

            console.log("======highlightedDocText======");
            console.log(highlightedDocText);

            setHighlightedReportText(highlightedDocText);
        } else {
            doc.preview = docText;
        }
    }

    // Update the checkbox state
    // The checed state won't be updated until the next render
    // That's when useEffect() hook is needed 
    const handleCheckbox = (position) => {
        console.log("Executing handleCheckbox for ");

        // Loop over the checkedVariables array using the array map method
        // If the value of the passed position parameter matches with the current index, reverse its value
        // If the value is true it will be converted to false using !item and if the value is false, then it will be converted to true
        const updatedCheckedVariables = checkedVariables.map((item, index) =>
            (index === position) ? !item : item
        );

        setCheckedVariables(updatedCheckedVariables);          
    };

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
                <span className="doc-info">Review Document Summary</span>
                </header>
                
                <div className="extracted-info">
                <ul className="list-group rounded-0">

                {variableNamesArr.map((name, index) => {
                    if (info[name]['value'] !== '') {
                        // Add `key` property to avoid: Warning: Each child in a list should have a unique "key" prop
                        if (name === 'grade' && info[name]['value'] === '9') {
                            return (
                                <li className="list-group-item" key={index}>
                                <input type="checkbox" className="form-check-input" disabled />
                                <label className="form-check-label">{name}: <span>{info.grade.value}</span><span className="term-count">(not determined or not stated)</span></label>
                                </li>
                            );
                        } else {
                            return (
                                <li key={index} className="list-group-item" key={index}>
                                <input type="checkbox" name={name} value={name} className="form-check-input" checked={checkedVariables[index]} onChange={() => handleCheckbox(index)} />
                                <label className="form-check-label">{name}: <span className={`${name}-term`}>{info[name].value}</span><span className="term-count">({info[name].mentions.length})</span></label>
                                </li>
                            );
                        }
                    }
                })}

                </ul>

                <div className="json"><code>{JSON.stringify(result.neoplasms, null, 2)}</code></div>

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