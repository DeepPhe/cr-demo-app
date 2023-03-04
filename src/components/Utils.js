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
        textMentionObj.cssClass = [cssClass];
        textMentionObj.beginOffset = item.begin;
        textMentionObj.endOffset = item.end;

        textMentionObj.tooltip = cssClass;
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


// let element = {
//     "text": "The blood pressure was initially elevated on the patient's outpatient medications, so his hypertension medicines were adjusted by increasing his lisinopril to 20 mg qd."
//   },
//   rawText = element.text.slice(),
//   spans = [{
//     "begin": 145,
//     "end": 155,
//     "tooltip": "section 1"
//   }, {
//     "begin": 4,
//     "end": 18,
//     "tooltip": "section 2"
//   }, {
//     "begin": 4,
//     "end": 18,
//     "tooltip": "section 3"
//   }, {
//     "begin": 90,
//     "end": 102,
//     "tooltip": "section 4"
//   }, {
//     "begin": 4,
//     "end": 41,
//     "tooltip": "section 5"
//   }];

// let highlightedString = createHighlightedString(spans,element.text);
// document.getElementById('text').innerHTML = highlightedString;

// https://stackoverflow.com/questions/40117156/creating-overlapping-text-spans-in-javascript
export function createHighlightedString(ranges, text) {
  var flatRanges = flattenRanges(ranges);
  var inflatedRanges = inflateRanges(flatRanges, text.length);
  var filledRanges = fillRanges(inflatedRanges, text);
  var str = "";
  var index = 0;
  for (var i in filledRanges) {
    var range = filledRanges[i];
    var begin = range.begin, end = range.end;
    if (range.count > 0) {
      if (range.tooltip) {
        //str += "<span class='highlight-" + range.count + " ooltip'>" + range.text + "<span class='tooltiptext tooltip-bottom'>" + range.tooltip.join('<br/>') + "</span></span>";
        str += "<span class='highlight-" + range.count + "'>" + range.text + "</span>";
      } else {
        str += "<span class='highlight-" + range.count + "'>" + range.text + "</span>";
      }
    } else {
      str += range.text;
    }
  }
  //return str;
  return <div dangerouslySetInnerHTML={{__html: str}} />;
}


function flattenRanges(ranges) {
  var points = [];
  var flattened = [];
  for (var i in ranges) {
    if (ranges[i].end < ranges[i].begin) { //RE-ORDER THIS ITEM (BEGIN/END)
      var tmp = ranges[i].end; //RE-ORDER BY SWAPPING
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
  for (var i in points) {
    if (i==0 || points[i]==points[i-1]) continue;
    var includedRanges = ranges.filter(function(x){
      return (Math.max(x.begin,points[i-1]) < Math.min(x.end,points[i]));
    });
    if (includedRanges.length > 0) {
      var flattenedRange = {
        begin:points[i-1],
        end:points[i],
        count:0
      }
      for (var j in includedRanges) {
        var includedRange = includedRanges[j];
        for (var prop in includedRange) {
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
  return flattened;
}

function inflateRanges(ranges, length=0) {
  var inflated = [];
  var lastIndex;
  for (var i in ranges) {
    if (i==0) {
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
  for (var i in ranges) {
    ranges[i].text = text.slice(ranges[i].begin,ranges[i].end+1);
  }
  return ranges;
}