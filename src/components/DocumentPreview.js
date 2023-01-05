
const DocumentPreview = ({ meta }) => {
    const { name, percent, status } = meta

    return (
        <div style={{ alignSelf: 'flex-start', margin: '10px 3%', fontFamily: 'Helvetica' }}>
            {name}, {Math.round(percent)}%, {status}
        </div>
    )
}


export default DocumentPreview;