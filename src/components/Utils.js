// Extract information from summarized json for rendering
export function getExtractedInfo(dataObj) {
    console.log("======Input: dataObj======");
    console.log(dataObj);

    let infoObj = {
        'topography': {
            'value': '',
            'bgcolor': '#cfe2ff',
            'cssClass': 'topography-term',
            'mentions': []
        },
        'histology': {
            'value': '',
            'bgcolor': '#f8d7da',
            'cssClass': 'histology-term',
            'mentions': []
        },
        'behavior': {
            'value': '',
            'bgcolor': '#a3cfbb',
            'cssClass': 'behavior-term',
            'mentions': []
        },
        'laterality': {
            'value': '',
            'bgcolor': '#ffe69c',
            'cssClass': 'laterality-term',
            'mentions': []
        },
        'grade': {
            'value': '',
            'bgcolor': '#ffb7b7',
            'cssClass': 'grade-term',
            'mentions': []
        }
    };

    dataObj.neoplasms[0].attributes.forEach(item => {
        if (item.name === 'topography_major') {
            infoObj.topography.value = item.value;
            infoObj.topography.mentions = getTextMentions(item.directEvidence, infoObj.topography.cssClass, infoObj.topography.bgcolor);
        }

        if (item.name === 'histology') {
            infoObj.histology.value = item.value;
            infoObj.histology.mentions = getTextMentions(item.directEvidence, infoObj.histology.cssClass, infoObj.histology.bgcolor);
        }

        if (item.name === 'behavior') {
            infoObj.behavior.value = item.value;
            infoObj.behavior.mentions = getTextMentions(item.directEvidence, infoObj.behavior.cssClass, infoObj.behavior.bgcolor);
        }

        if (item.name === 'laterality') {
            infoObj.laterality.value = item.value;
            infoObj.laterality.mentions = getTextMentions(item.directEvidence, infoObj.laterality.cssClass, infoObj.laterality.bgcolor);
        }

        if (item.name === 'grade') {
            infoObj.grade.value = item.value;
            infoObj.grade.mentions = getTextMentions(item.directEvidence, infoObj.grade.cssClass, infoObj.grade.bgcolor);
        }
    });

    console.log("======Output: infoObj======");
    console.log(infoObj);

    return infoObj;
}


// Build the target text mentions array from the source array
function getTextMentions(arr, cssClass, bgcolor) {
    let textMentions = [];
    
    arr.forEach(item => {
        let textMentionObj = {};
        // To support old implementation
        textMentionObj.cssClass = cssClass;
        textMentionObj.beginOffset = item.begin;
        textMentionObj.endOffset = item.end;

        // To support new implementation
        textMentionObj.bgcolor = bgcolor;
        textMentionObj.begin = item.begin;
        textMentionObj.end = item.end;
        
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


// Based on https://stackoverflow.com/questions/40117156/creating-overlapping-text-spans-in-javascript
export function createHighlightedString(ranges, text) {
    let flatRanges = flattenRanges(ranges);
    let inflatedRanges = inflateRanges(flatRanges, text.length);
    let filledRanges = fillRanges(inflatedRanges, text);
    let str = '';
    let index = 0;

    for (let i in filledRanges) {
        let range = filledRanges[i];
        let begin = range.begin, end = range.end;

        if (range.count > 0) {
            // range.cssClass is an array
            console.log("======range.cssClass======");
            console.log(range.cssClass);
            
            console.log("======range.bgcolor======");
            console.log(range.bgcolor);

            // Currently we don't handle overlapping from more than two variables
            // Note: the range.text contains an extra char at the end
            if (range.bgcolor.length === 2) {
                str += '<span style="background: linear-gradient(to bottom, ' + range.bgcolor[0] + ' 50%, ' + range.bgcolor[1] + ' 50%);">' + range.text + '</span>';
            } else if (range.bgcolor.length === 1) {
                // str += '<span class="' + range.cssClass[0] + '">' + range.text + '</span>';
                str += '<span style="background: ' + range.bgcolor[0] + '">' + range.text + '</span>';
            } else {
                console.log("======range.bgcolor has more than 2 variables overlapping======");
            }
        } else {
            str += range.text;
        }
    }

    //return str;

    console.log("======str======");
    console.log(str);

    return <div dangerouslySetInnerHTML={{__html: str}} />;
}


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
    points.sort(function(a, b){return a-b});
    //FIND THE INTERSECTING SPANS FOR EACH PAIR OF POINTS (IF ANY)
    //ALSO MERGE THE ATTRIBUTES OF EACH INTERSECTING SPAN, AND INCREASE THE COUNT FOR EACH INTERSECTION
    for (let i in points) {
        if (i == 0 || points[i] == points[i-1]) continue;
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
                    if (prop != 'begin' && prop != 'end') {
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


function inflateRanges(ranges, length=0) {
    let inflated = [];
    let lastIndex;
    for (let i in ranges) {
        if (i == 0) {
            //IF THERE IS EMPTY TEXT IN THE BEGINNING, CREATE AN EMOTY RANGE
            if (ranges[i].begin > 0){
                inflated.push({
                    begin:0,
                    end:ranges[i].begin-1,
                    count:0
                });
            }

            inflated.push(ranges[i]);
        } else {
            if (ranges[i].begin == ranges[i-1].end) {
                ranges[i-1].end--;
            }
            
            if (ranges[i].begin - ranges[i-1].end > 1) {
                inflated.push({
                    begin:ranges[i-1].end+1,
                    end:ranges[i].begin-1,
                    count:0
                });
            }
            inflated.push(ranges[i]);
        }
        lastIndex = ranges[i].end;
    }
    //FOR SIMPLICITY, ADD ANY REMAINING TEXT AS AN EMPTY RANGE
    if (lastIndex+1 < length-1) {
        inflated.push({
            begin:lastIndex+1,
            end:length-1,
            count:0
        })
    }

    return inflated;
}

function fillRanges(ranges, text) {
    for (let i in ranges) {
        // This causes the range.text contains an extra char at the end
        // Will need to figure out a better solution
        ranges[i].text = text.slice(ranges[i].begin, ranges[i].end + 1);
    }

    return ranges;
}