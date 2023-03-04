// Extract information from summarized json for rendering
export function getExtractedInfo(dataObj) {
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
        if (item.name === 'topography_major') {
            infoObj.topography.value = item.value;
            infoObj.topography.mentions = getTextMentions(item.directEvidence, 'topography-term');
        }

        if (item.name === 'histology') {
            infoObj.histology.value = item.value;
            infoObj.histology.mentions = getTextMentions(item.directEvidence, 'histology-term');
        }

        if (item.name === 'behavior') {
            infoObj.behavior.value = item.value;
            infoObj.behavior.mentions = getTextMentions(item.directEvidence, 'behavior-term');
        }

        if (item.name === 'laterality') {
            infoObj.laterality.value = item.value;
            infoObj.laterality.mentions = getTextMentions(item.directEvidence, 'laterality-term');
        }

        if (item.name === 'grade') {
            infoObj.grade.value = item.value;
            infoObj.grade.mentions = getTextMentions(item.directEvidence, 'grade-term');
        }
    });

    console.log("======Output: infoObj======");
    console.log(infoObj);

    return infoObj;
}


// Build the target text mentions array from the source array
function getTextMentions(arr, cssClass) {
    let textMentions = [];
    
    arr.forEach(item => {
        let textMentionObj = {};
        textMentionObj.cssClass = [cssClass]
        textMentionObj.beginOffset = item.begin;
        textMentionObj.endOffset = item.end;
        
        textMentions.push(textMentionObj);
    });

    return textMentions;
}


// Highlight one or multiple text mentions
export function highlightTextMentions(textMentions, cssClass, reportText) {
    // Sort the textMentions array first based on beginOffset
    textMentions.sort(function(a, b) {
        let comp = a.beginOffset - b.beginOffset;
        if (comp === 0) {
            return b.endOffset - a.endOffset;
        } else {
            return comp;
        }
    });

    console.log("======sorted textMentions======");
    console.log(textMentions);

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

