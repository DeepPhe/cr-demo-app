// components in curly brackets are named export
// no need to use curly brackets for default export
import {ThreeDots} from 'react-loader-spinner';
import {usePromiseTracker} from 'react-promise-tracker';


/**
 * This function is a valid React component because it accepts a single `props` (which stands for properties) 
 * object argument with data and returns a React element. We call such components "function components" 
 * because they are literally JavaScript functions.
 *
 * @param {object} props The properties object as input to a React component
 */
function Spinner(props) {
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
            visible={true} />
        }
        </span>
    );
}


export default Spinner;