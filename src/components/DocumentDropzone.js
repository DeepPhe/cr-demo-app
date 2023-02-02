// components in curly brackets are named export
// no need to use curly brackets for default export
import {useState, useEffect} from "react";
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
        'topography': {
            'value': '',
            'mentions': []
        },
        'histology': {
            'value': '',
            'mentions': []
        },
        'behavior': {
            'value': '',
            'mentions': []
        },
        'laterality': {
            'value': '',
            'mentions': []
        },
        'grade': {
            'value': '',
            'mentions': []
        }
    };

    dataObj.neoplasms[0].attributes.forEach(item => {
        if (item.name === 'location') {
            infoObj.topography.value = item.value;
            infoObj.topography.mentions = getTextMentions(item.directEvidence);
        }

        if (item.name === 'histologic_type') {
            infoObj.histology.value = item.value;
            infoObj.histology.mentions = getTextMentions(item.directEvidence);
        }

        if (item.name === 'behavior') {
            infoObj.behavior.value = item.value;
            infoObj.behavior.mentions = getTextMentions(item.directEvidence);
        }

        if (item.name === 'laterality') {
            infoObj.laterality.value = item.value;
            infoObj.laterality.mentions = getTextMentions(item.directEvidence);
        }

        if (item.name === 'grade') {
            infoObj.grade.value = item.value;
            infoObj.grade.mentions = getTextMentions(item.directEvidence);
        }
    });

    console.log("======Output: infoObj======");
    console.log(infoObj);

    return infoObj;
}


// 
function getTextMentions(arr) {
    let textMentions = [];
    
    arr.forEach(item => {
        let textMentionObj = {};
        textMentionObj.text = item.classUri;
        textMentionObj.beginOffset = item.begin;
        textMentionObj.endOffset = item.end;
        
        textMentions.push(textMentionObj);
    });

    return textMentions;
}


// Highlight one or multiple text mentions
function highlightTextMentions(textMentions, cssClass, reportText) {
    // Sort the textMentions array first based on beginOffset
    textMentions.sort(function(a, b) {
        let comp = a.beginOffset - b.beginOffset;
        if (comp === 0) {
            return b.endOffset - a.endOffset;
        } else {
            return comp;
        }
    });

    let textFragments = [];

    if (textMentions.length === 1) {
        let textMention = textMentions[0];

        if (textMention.beginOffset === 0) {
            textFragments.push('');
        } else {
            textFragments.push(reportText.substring(0, textMention.beginOffset));
        }

        // Don't use `className` attr, only `class` works
        textFragments.push('<span class="' + cssClass + '">' + reportText.substring(textMention.beginOffset, textMention.endOffset) + '</span>');
        textFragments.push(reportText.substring(textMention.endOffset));
    } else {
        let lastValidTMIndex = 0;

        for (let i = 0; i < textMentions.length; i++) {
            let textMention = textMentions[i];
            let lastValidTM = textMentions[lastValidTMIndex];

            // If this is the first textmention, paste the start of the document before the first TM.
            if (i === 0) {
                if (textMention.beginOffset === 0) {
                    textFragments.push('');
                } else {
                    textFragments.push(reportText.substring(0, textMention.beginOffset));
                }
            } else { // Otherwise, check if this text mention is valid. if it is, paste the text from last valid TM to this one.
                if (textMention.beginOffset < lastValidTM.endOffset) {
                        // Push end of the document
                    continue; // Skipping this TM.
                } else{
                    textFragments.push(reportText.substring(lastValidTM.endOffset, textMention.beginOffset));
                }
            }

            // Don't use `className` attr, only `class` works
            textFragments.push('<span class="' + cssClass + '">' + reportText.substring(textMention.beginOffset, textMention.endOffset) + '</span>');
            lastValidTMIndex = i;
        }
        // Push end of the document
        textFragments.push(reportText.substring(textMentions[lastValidTMIndex].endOffset));
    }

    // Assemble the final report content with highlighted texts
    let highlightedReportText = '';

    for (let j = 0; j < textFragments.length; j++) {
        highlightedReportText += textFragments[j];
    }

    console.log("======highlightedReportText======");
    console.log(highlightedReportText);

    return <div dangerouslySetInnerHTML={{__html: highlightedReportText}} />;
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
    const [docText, setDocText] = useState(''); // Empty string as initial state
    const [highlightedReportText, setHighlightedReportText] = useState(''); // Empty string as initial state
    const [result, setResult] = useState({}); // Empty object as initial state
    const [error, setError] = useState({}); // Empty object as initial state

    // Function component of the spinner
    const Spinner = props => {
        const { promiseInProgress } = usePromiseTracker();

        return (
            <span className="spinner">
            {promiseInProgress && 
            <ThreeDots 
            height="30" 
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

    // Only re-run the effect if highlightedReportText changes
    // useEffect(() => {
    //     documentPreview();
    // }, [highlightedReportText]);
    
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
                    <li className="list-group-item">Topography: <span className="term topography-term" onClick={() => highlightText(info.topography.mentions, 'topography-term')}>{info.topography.value}</span></li>
                }

                {info.histology.value !== '' &&
                    <li className="list-group-item">Histology: <span className="term histology-term" onClick={() => highlightText(info.histology.mentions, 'histology-term')}>{info.histology.value}</span></li>
                }

                {info.behavior.value !== '' &&
                    <li className="list-group-item">Behavior: <span className="term behavior-term" onClick={() => highlightText(info.behavior.mentions, 'behavior-term')}>{info.behavior.value}</span></li>
                }

                {info.laterality.value !== '' &&
                    <li className="list-group-item">Laterality: <span className="term laterality-term" onClick={() => highlightText(info.laterality.mentions, 'laterality-term')}>{info.laterality.value}</span></li>
                }

                {info.grade.value !== '' &&
                    <li className="list-group-item">Grade: <span className="term grade-term" onClick={() => highlightText(info.grade.mentions, 'grade-term')}>{info.grade.value}</span></li>
                }
                </ul>
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


export default DocumentDropzone;