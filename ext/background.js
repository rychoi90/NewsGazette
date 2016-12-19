
// The following waits for a connection from the 
// extension in order to make a reverse connection. 
chrome.runtime.onConnect.addListener(function(portToBackground) {
  var portToExtension = chrome.runtime.connect({name:"newsgate"});
  actions.getContentAndUrl(null, portToExtension);
  portToBackground.onMessage.addListener(function(message) {
    handleMessage(message, portToExtension);
  });
});

function handleMessage(msg, port) {
  actions[msg.method](msg, port);
};

//add extension -- background.js communication methods here:
const actions = {
  getContentAndUrl: function(msg, port){
    port.postMessage({
      "method": 'getContentAndUrl',
      "data": { scraped: $('p').toArray().map(item => item.innerText).join(' ').replace(/[\r\n]/g, ''), 
                url: window.location.href}
              });
  },
  getUserSelectedText: function(msg, port) {
     port.postMessage({
      "method": 'getUserSelectedText',
      "data": { scraped: window.getSelection().toString(), 
                url: window.location.href}
              });
  },
  
  highlightContent: function(msg, port) {
    msg.style = msg.style || {atr: 'background', value:'orange'};
    removeHighlight();
    styleStringInContent(regexConstructor(msg.modes), msg.style.atr, msg.style.value);
    //to post to the server:
     // port.postMessage({
     //  "method": 'highlightContent',
     //  "data": { scraped: window.getSelection().toString(), 
     //            url: window.location.href}
     //          });
  },
   
  highlightSentiment: function(msg, port) {
    msg.style = msg.style || {atr: 'background-color', value:'green'};
    removeHighlight(); //first clear styles in the page.
    styleStringInContent(msg.sentence, msg.style.atr, msg.style.value, msg.i);
    // document.getElementById("highlightItem-" + msg.i).scrollIntoView();
    var divPosition = $("#highlightItem-" + msg.i).offset();
    $('html, body').animate({scrollTop: divPosition.top}, "slow");
  }

};


// Utility functions:
const utils = {
  getUrl: function(msg, port) {
      return window.location.href;
    },
  scrapePlain: function(msg, port){
    return $('p').toArray().map(p => p.innerText).join(' ');
  }
};


//all modes for the highlighter
var allModes = ['metrics', 'quotations', 'extreme'];

//returns an array of regex testeres to test against 
var regexConstructor = function(modes){
  
  const quantifiers = '(\\d+|a|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
  const binders = '(-| |)'; //dash, empty or none
  const multipliers = '(m|b|thousand|hundred|dozen|fold|times|x|X|percent|%)';
  const significant = '\\d+[.|,]\\d+';
  const numbers = '\\d+';
  const quotations = '"';
  const repetition = '(double|triple|quadruple)';
  const frequency = '(once|twice|thrice)+(?= a|-)';

  const financial = '(thousand|million|billion)';

  var options = {
    metrics: function() {
      var r1 = new RegExp(numbers);
      var r2 = new RegExp(financial);
      return [r1, r2];

      // var r1 = new RegExp( quantifiers +'(?=' + binders + multipliers  + ')', 'g');
      // var r2 = new RegExp(significant, 'g');
      // var r3 = new RegExp(repetition);
      // var r4 = new RegExp(frequency);
      // return [r1, r2, r3, r4];
    },
    quotations: function(){
      return [new RegExp(quotations)];
    },
    numbers: function() {
      return [new RegExp(numbers)];
    },
    extreme: function(){
      //TODO
      return [];
    } 
  };

  return modes.map(mode => (options[mode]()))
          .reduce((a,b) => a.concat(b));
};

const removeHighlight = function() {
  $('p').toArray().forEach(p => {p.innerText = p.innerText});
};

//Assumptions:
//1 - all the content is in paragraphs
//2 - paragraph elements have no incomplete sentences (a sentence can not be in two paragrahs)

//interface: string | regex, string, string
//Ex: first argument could be /\d+/ for testing numbers. 

//parerga: textContent or innerText ? 
const styleStringInContent = function(str, cssProperty, cssValue, sentenceId) {
  const beginMarker = '~';
  const endMarker ='`';

  //mark text and inject html tags:
  var markerFunction = function(tag, str, startIndex) {   
    tag.textContent = tag.textContent.slice(0,startIndex) +
    beginMarker + str + endMarker + tag.textContent.slice(startIndex + str.length);
  };

  var htmlInjector = function(tagType, element, paragraph, id) {
    var htmlElementToInjectBegin = '';
    var htmlElementToInjectEnd = '</' + tagType + '>';
    if(element === 'class') {
      htmlElementToInjectBegin = '<' + tagType + ' ' + element + '="highlightItem">';
    } else if (element === 'id') {
      htmlElementToInjectBegin = '<' + tagType + ' ' + element + '="highlightItem-'+ id + '"'+ '>';
    }
    paragraph.innerHTML = paragraph.innerHTML.replace(/~/gi, htmlElementToInjectBegin);
    paragraph.innerHTML = paragraph.innerHTML.replace(/`/gi, htmlElementToInjectEnd);
  };

  //process the content:
  $('p').toArray().forEach((paragraph, i) => {
    // if(i === 5) {debugger;}
    var text = paragraph.textContent;    
    if(typeof str ==='string') {
      var startIndex = text.indexOf(str);
      if(startIndex !== -1) {
        markerFunction(paragraph, str, startIndex);
        htmlInjector('span','id', paragraph, sentenceId);
        $('#highlightItem-'+ sentenceId).css(cssProperty,cssValue);
      }
    } else {
      //inject html to the paragraph:a
      var facts = text.split('.').filter(sentence => some(str, s => s.test(sentence)));
      facts.forEach(fact => markerFunction(paragraph, fact, paragraph.textContent.indexOf(fact)));
      htmlInjector('span', 'class', paragraph, null);
    }
  });
    $('.highlightItem').css(cssProperty,cssValue);
  // if(typeof str !== 'string') {
  //   $('.highlightItem').css(cssProperty,cssValue);
  // }
};


//underscore function:
function some (array, test) {
  var result = [];
  result = array.filter(item => test(item));
  if(result.length) {
    return true;
  }
  else return false;
}

