// useState is a Hook that lets you add React state to function components
import React, {useState} from "react";
import {useDropzone} from 'react-dropzone';


function DocumentDropzone(props) {
    // Declare a new state variable `files` with an empty array as initial state
    // It returns a pair of values: the current state and a function that updates it
    const [files, setFiles] = useState([]);

    // const with curly brackets is object destructuring assignment from ES6 specifications
    // a shorthand way to initialize variables from object properties
    const {getRootProps, getInputProps} = useDropzone({
        // Single file mode
        multiple: false,
        // Only accept text file
        accept: {
            'text/plain': ['.txt']
        },
        onDrop: acceptedFiles => {
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

    // Add `key`` property to avoid: Warning: Each child in a list should have a unique "key" prop
    // Use <pre> to preserve the original preformatted text, 
    // in which structure is represented by typographic conventions rather than by elements.
    const DocumentPreview = files.map(file => (
        <div key={file.name} className="preview">
        <p className="text-primary">{file.name}, {file.size}</p>
        <pre>{file.preview}</pre>
        </div>
    ));


    // The spread syntax is denoted by three dots
    return (
        <div {...getRootProps()}>
        <input {...getInputProps()} />
        
        <p className="drop-zone alert alert-primary">Drag 'n' drop patient document here, or click to select file</p>

        <div>
        {DocumentPreview}
        </div>

        </div>
    )
}


export default DocumentDropzone;