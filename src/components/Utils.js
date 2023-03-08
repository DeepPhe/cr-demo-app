import {variablesObj} from './Variables.js';

// Extract information from summarized json for rendering
export function getExtractedInfo(dataObj) {
    console.log("======Input: dataObj======");
    console.log(dataObj);

    let infoObj = variablesObj;

    dataObj.neoplasms[0].attributes.forEach(item => {
        if (item.name === 'topography_major') {
            infoObj.topography.value = item.value;
            infoObj.topography.mentions = getTextMentions(item.directEvidence, infoObj.topography.bgcolor);
        }

        if (item.name === 'histology') {
            infoObj.histology.value = item.value;
            infoObj.histology.mentions = getTextMentions(item.directEvidence, infoObj.histology.bgcolor);
        }

        if (item.name === 'behavior') {
            infoObj.behavior.value = item.value;
            infoObj.behavior.mentions = getTextMentions(item.directEvidence, infoObj.behavior.bgcolor);
        }

        if (item.name === 'laterality') {
            infoObj.laterality.value = item.value;
            infoObj.laterality.mentions = getTextMentions(item.directEvidence, infoObj.laterality.bgcolor);
        }

        if (item.name === 'grade') {
            infoObj.grade.value = item.value;
            infoObj.grade.mentions = getTextMentions(item.directEvidence, infoObj.grade.bgcolor);
        }
    });

    console.log("======Output: infoObj======");
    console.log(infoObj);

    return infoObj;
}


// Build the target text mentions array from the source array
function getTextMentions(arr, bgcolor) {
    let textMentions = [];
    
    arr.forEach(item => {
        let textMentionObj = {};
        textMentionObj.bgcolor = bgcolor;
        textMentionObj.begin = item.begin;
        textMentionObj.end = item.end;
        
        textMentions.push(textMentionObj);
    });

    return textMentions;
}

// Highlight one or multiple text mentions
export function highlightTextMentions(textMentions, reportText) {
    // Sort the textMentions array first based on beginOffset
    textMentions.sort(function(a, b) {
        let comp = a.begin - b.begin;
        if (comp === 0) {
            return b.end - a.end;
        } else {
            return comp;
        }
    });

    console.log("======sorted textMentions======");
    console.log(textMentions);

    // Flatten the ranges, this is the key to solve overlapping
    textMentions = flattenRanges(textMentions);

    let textFragments = [];

    if (textMentions.length === 1) {
        let textMention = textMentions[0];

        if (textMention.begin === 0) {
            textFragments.push('');
        } else {
            textFragments.push(reportText.substring(0, textMention.begin));
        }

        // Don't use `className` attr, only `class` works
        //textFragments.push('<span class="' + cssClass + '">' + reportText.substring(textMention.begin, textMention.end) + '</span>');

        // Currently we don't handle overlapping from more than two variables
        // Note: the range.text contains an extra char at the end
        if (textMention.count === 1) {
            let str = '<span style="background: ' + textMention.bgcolor[0] + '">' + reportText.substring(textMention.begin, textMention.end) + '</span>';
            textFragments.push(str);
        } else {
            console.log("Incorrect data, should be only 1 text mention with 1 bgcolor");
        }

        textFragments.push(reportText.substring(textMention.end));
    } else {
        let lastValidTMIndex = 0;

        for (let i = 0; i < textMentions.length; i++) {
            let textMention = textMentions[i];
            let lastValidTM = textMentions[lastValidTMIndex];

            // If this is the first textmention, paste the start of the document before the first TM.
            if (i === 0) {
                if (textMention.begin === 0) {
                    textFragments.push('');
                } else {
                    textFragments.push(reportText.substring(0, textMention.begin));
                }
            } else { // Otherwise, check if this text mention is valid. if it is, paste the text from last valid TM to this one.
                if (textMention.begin < lastValidTM.end) {
                        // Push end of the document
                    continue; // Skipping this TM.
                } else{
                    textFragments.push(reportText.substring(lastValidTM.end, textMention.begin));
                }
            }

            // Don't use `className` attr, only `class` works
            //textFragments.push('<span class="' + cssClass + '">' + reportText.substring(textMention.beginOffset, textMention.endOffset) + '</span>');
            
            if (textMention.count === 1) {
                let str = '<span style="background: ' + textMention.bgcolor[0] + '">' + reportText.substring(textMention.begin, textMention.end) + '</span>';
                textFragments.push(str);
            }else if (textMention.count >= 2 && textMention.count <= Object.keys(variablesObj).length) {
                // 2 color example: background: linear-gradient(to bottom, #f8d7da 0%, #f8d7da 50%, #a3cfbb 50%, #a3cfbb 100%);
                // 3 color example: style="background: linear-gradient(to bottom, #f8d7da 0%, #f8d7da 33.33%, #a3cfbb 33.33%, #a3cfbb 66.66%, #cfe2ff 66.66%, #cfe2ff 99.99%);"
                let colorDistribution = buildColorDistribution(textMention);
                let str = '<span style="background: linear-gradient(to bottom, ' + colorDistribution.join(", ") + ');">' + reportText.substring(textMention.begin, textMention.end) + '</span>';
                textFragments.push(str);
            } else {
                console.log("Incorrect data, should not have more than " + Object.keys(variablesObj).length + " variables/colors");
            }

            lastValidTMIndex = i;
        }
        // Push end of the document
        textFragments.push(reportText.substring(textMentions[lastValidTMIndex].end));
    }

    // Assemble the final report content with highlighted texts
    let highlightedReportText = '';

    for (let j = 0; j < textFragments.length; j++) {
        highlightedReportText += textFragments[j];
    }

    // console.log("======highlightedReportText======");
    // console.log(highlightedReportText);

    return <div dangerouslySetInnerHTML={{__html: highlightedReportText}} />;
}

// 2 color example: #f8d7da 0%, #f8d7da 50%, #a3cfbb 50%, #a3cfbb 100%
// 3 color example: #f8d7da 0%, #f8d7da 33.33%, #a3cfbb 33.33%, #a3cfbb 66.66%, #cfe2ff 66.66%, #cfe2ff 99.99%
function buildColorDistribution(textMention) {
    let colorDistribution = [];
    let increment = (100/textMention.count).toFixed(2);
    
    for (let i = 0; i < textMention.count; i++) {
        let bgcolor = textMention.bgcolor[i];
        colorDistribution.push(bgcolor + " " + i*increment + "%");
        colorDistribution.push(bgcolor + " " + (i + 1)*increment + "%");
    }

    return colorDistribution;
}

// Based on https://stackoverflow.com/questions/40117156/creating-overlapping-text-spans-in-javascript
function flattenRanges(ranges) {
    console.log("======input ranges======");
    console.log(ranges);

    let points = [];
    let flattened = [];
    for (let i in ranges) {
        if (ranges[i].end < ranges[i].begin) { //RE-ORDER THIS ITEM (BEGIN/END)
            let tmp = ranges[i].end; //RE-ORDER BY SWAPPING
            ranges[i].end = ranges[i].begin;
            ranges[i].begin = tmp;
        }

        points.push(ranges[i].begin);
        points.push(ranges[i].end);
    }

    //MAKE SURE OUR LIST OF POINTS IS IN ORDER
    points.sort(function(a, b) {
        return a - b;
    });

    // FIND THE INTERSECTING SPANS FOR EACH PAIR OF POINTS (IF ANY)
    // ALSO MERGE THE ATTRIBUTES OF EACH INTERSECTING SPAN, AND INCREASE THE COUNT FOR EACH INTERSECTION
    for (let i in points) {
        if (i === 0 || points[i] === points[i-1]) continue;
        let includedRanges = ranges.filter(function(x) {
            return (Math.max(x.begin,points[i-1]) < Math.min(x.end,points[i]));
        });

        if (includedRanges.length > 0) {
            let flattenedRange = {
                begin:points[i-1],
                end:points[i],
                count:0
            }

            for (let j in includedRanges) {
                let includedRange = includedRanges[j];

                for (let prop in includedRange) {
                    if (prop !== 'begin' && prop !== 'end') {
                        if (!flattenedRange[prop]) flattenedRange[prop] = [];
                        flattenedRange[prop].push(includedRange[prop]);
                    }
                }

                flattenedRange.count++;
            }

            flattened.push(flattenedRange);
        }
    }

    console.log("======flattened ranges======");
    console.log(flattened);

    return flattened;
}

