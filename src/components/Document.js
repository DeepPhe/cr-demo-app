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
import topography from '../data/topography.json';
import morphology from '../data/morphology.json';
import laterality from '../data/laterality.json';
import grade from '../data/grade.json';
import {getExtractedInfo, highlightTextMentions, capitalize} from './Utils.js';


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
    const [doc, setDoc] = useState({}); // Uploaded doc file, empty object as initial state
    const [docText, setDocText] = useState(''); // The original plain text of the doc, empty string as initial state
    const [docPreview, setDocPreview] = useState(''); // The preview of doc, contains highlighted html. Empty string as initial state
    const [nlpResult, setNlpResult] = useState({}); // NLP extracted json, empty object as initial state
    const [error, setError] = useState({}); // Empty object as initial state
    
    // Variables and their checkboxes
    const variableNamesArr = [];
    for (const key of Object.keys(variablesObj)) {
        if (variablesObj[key].visible === true) {
            variableNamesArr.push(key);
        }
    }
    
    // By default, all the variable checkboxes are selected to highlight the text mentions
    const [checkedVariables, setCheckedVariables] = useState(new Array(variableNamesArr.length).fill(true));

    // Reset the state variables on each new file selection
    function resetAllStates() {
        console.log("Executing resetAllStates()...");

        setDoc({});
        setDocText('');
        setDocPreview('');
        setNlpResult({});
        setError('');
        setCheckedVariables(new Array(variableNamesArr.length).fill(true));
    }

    // Reset the state variables on each click of the Summarize button
    function resetSummaryStates() {
        console.log("Executing resetSummaryStates()...");

        setDocPreview(docText);
        setNlpResult({});
        setError('');
        setCheckedVariables(new Array(variableNamesArr.length).fill(true));
    }

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
            resetAllStates();

            // `acceptedFiles` is an array and stores the details of each accepted file
            console.log("======acceptedFiles======");
            console.log(acceptedFiles);

            // We only handle one file
            let docFile = acceptedFiles[0];

            // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
            // no arguments
            const reader = new FileReader();

            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            reader.onload = () => {
                // Do whatever you want with the file contents
                const binaryStr = reader.result;

                // console.log("======binaryStr======");
                // console.log(binaryStr);

                setDocText(binaryStr);
                setDocPreview(binaryStr);
            }

            // Note, this readAsText() returns None (undefined).
            reader.readAsText(docFile);

            // Update the state variable `doc` using the `docFile` information 
            setDoc(docFile);
        }
    });

    // Submit button handler
    // Fetch data from backend API and store the text to react state variable
    function summarizeDocument() {
        console.log("Executing summarizeDocument()...");

        resetSummaryStates();

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
                data: docText // The original doc plain text
            })
            .then(
                (res) => {
                    // console.log("======API call response: res======");
                    // console.log(res)

                    // `data` is an object here
                    setNlpResult(res.data);

                    // Trigger multihighlighting
                    // Without this line, the text preview won't highlight any text mentions
                    // even though resetSummaryStates() was called earlier
                    setCheckedVariables(new Array(variableNamesArr.length).fill(true));

                    // console.log("======Pretty print======");
                    // console.log(JSON.stringify(res.data, null, 2));
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (err) => {
                    console.log("======API call error: err======");
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
                <button type="submit" className="btn btn-success btn-sm" onClick={summarizeDocument}>Summarize =></button> 
                <Spinner />
                </header>
                <div className="doc-content">{docPreview}</div>
                </div>
            )
        }
    }

    // Show multi highlighting after the DOM has been updated based on the `checkedVariables` dependency
    useEffect(() => {
        console.log("Executing useEffect()...");

        console.log("======checkedVariables======");
        console.log(checkedVariables);
        
        // Need this if check otherwise error on initial load when `nlpResult` is an empty Object
        if (Object.keys(nlpResult).length > 0) {
            multiHighlighting();
        }
    // Add the below comment line to disable the ESLint rule, otherwise will see error: React Hook useEffect has missing dependencies: 'multiHighlighting' and 'nlpResult'.
    // eslint-disable-next-line
    }, [checkedVariables]);

    // Highlight the target text mentions in report text
    function multiHighlighting() {
        console.log("Executing multiHighlighting()...");

        // Always reset to empty
        let allTextMentions = [];

        let info = getExtractedInfo(nlpResult, docText);

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
            let highlightedDocHtml = highlightTextMentions(allTextMentions, docText);

            console.log("======highlightedDocHtml======");
            console.log(highlightedDocHtml);

            // Update preview state
            setDocPreview(highlightedDocHtml);
        } else {
            setDocPreview(docText);
        }
    }

    // Update the checkbox state
    // The checed state won't be updated until the next render
    // That's when useEffect() hook is needed 
    const handleCheckbox = (position) => {
        console.log("Executing handleCheckbox for position: " + position);

        // Loop over the checkedVariables array using the array map method
        // If the value of the passed position parameter matches with the current index, reverse its value
        // If the value is true it will be converted to false using !item and if the value is false, then it will be converted to true
        const updatedCheckedVariables = checkedVariables.map((item, index) =>
            (index === position) ? !item : item
        );

        setCheckedVariables(updatedCheckedVariables);      
    };

    // Show the extracted info along with json payload of summarized doc or error message or nothing
    // `nlpResult` is json object
    function summarizedDocument() {
        console.log("Executing summarizedDocument()...");

        // Show error message as long as the `error` is not empty object\
        // Show summaried doc as long as the `nlpResult` is not empty object
        if (Object.keys(error).length > 0) {
            return (<div className="alert alert-danger">{error.message}</div>);
        } else if (Object.keys(nlpResult).length > 0) {
            let info = getExtractedInfo(nlpResult, docText);

            // Add additional properties for dropdown menu rendering
            info.topography.dropdownOptions = topography.map(item => (item.code + ' - ' + item.description));
            info.topography.dropdownDefaultValue = info.topography.dropdownOptions.find(option => option.startsWith(info.topography.value));
            
            info.morphology.dropdownOptions = morphology.map(item => (item.histology_code + '/' + item.behavior_code + ' - ' + item.description));
            info.morphology.dropdownDefaultValue = info.morphology.dropdownOptions.find(option => option.startsWith(info.morphology.value));
            
            info.laterality.dropdownOptions = laterality.map(item => (item.code + ' - ' + item.description));
            info.laterality.dropdownDefaultValue = info.laterality.dropdownOptions.find(option => option.startsWith(info.laterality.value));
            
            info.grade.dropdownOptions = grade.map(item => (item.code + ' - ' + item.description));
            info.grade.dropdownDefaultValue = info.grade.dropdownOptions.find(option => option.startsWith(info.grade.value));
            
            // JSX expression
            return (
                <div className="doc-summary">
                <header className="doc-header">
                <span className="doc-info">Review Document Summary</span>
                </header>
                <div className="extracted-info">
                {variableNamesArr.map((name, index) => {
                    const bgStyles = {
                        background: info[name].bgcolor
                    };

                    const renderCheckbox = () => {
                        if (info[name].mentions.length === 0) {
                            return (<input type="checkbox" name={name} value={name} checked={checkedVariables[index]} disabled />);
                        } else {
                            return (<input type="checkbox" name={name} value={name} checked={checkedVariables[index]} onChange={() => handleCheckbox(index)} />);
                        } 
                    };

                    // Add `key` property to avoid: Warning: Each child in a list should have a unique "key" prop
                    return (
                        <div className="card border-secondary mb-3" key={index}>
                        <div className="card-header">{capitalize(name)}</div>
                        <div className="card-body text-success">
                        <div className="dropdown">
                        <select className="form-select form-select-sm" defaultValue={info[name].dropdownDefaultValue}>
                        {info[name].dropdownOptions.map((text, index) => {
                            return (
                                <option value={text} key={index}>{text}</option>
                            );
                        })}
                        </select>
                        </div>
                        {renderCheckbox()}
                        <label className="checkbox-label"><span style={bgStyles}>Highlight text</span><span className="text-primary term-count">({info[name].mentions.length})</span></label>
                        </div>
                        </div>
                    );
                })}
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
        <p className="btn btn-primary">CLICK TO SELECT A PATIENT NOTE</p>
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