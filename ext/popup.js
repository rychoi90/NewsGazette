$(function() {


  document.getElementById('dataVision').addEventListener('click', handleHighlightCommand);
  document.getElementById('metrics').addEventListener('click', handleHighlightCommand);
  document.getElementById('quotations').addEventListener('click', handleHighlightCommand);

  var initEmotions = {
    'anger': '0.00',
    'disgust': '0.00',
    'fear': '0.00',
    'joy': '0.00',
    'sadness': '0.00'
  };

  $('#main').after('<div id="spinner"></div>');
  $('#spinner').load('spin.svg');

  $('.emotion.component').load('emotion.html', function() {
    updateEmotions(initEmotions);
    initRadialGraph(initEmotions);
  });

  // $('.relatedArticles.component').load('related.html', function() {
  //   // updateLinks(sampleLinks);
  // });

  function makeRandomEmotions() {
    return {
      'anger': Math.random().toFixed(2),
      'disgust': Math.random().toFixed(2),
      'fear': Math.random().toFixed(2),
      'joy': Math.random().toFixed(2),
      'sadness': Math.random().toFixed(2)
    };
  }

  function updateEmotions(emotions) {
    var values = Object.keys(emotions).map(key =>
      parseFloat(emotions[key]));

    $('.summary-emotion-graph--row').each(function(index) {
      var $this = $(this);
      var val = values[index];
      var barWidth = (val*100).toFixed(2)+'%';
      var labelValue = val.toFixed(2);
      var likelihood = (val > 0.5) ? 'LIKELY' : 'UNLIKELY';
      $this.find('.summary-emotion-graph--bar-value').css('width', barWidth);
      var labels = $this.find('.summary-emotion-graph--percentage-label').find('span');
      $(labels[0]).text(labelValue);
      $(labels[1]).text(likelihood);
    });
  }


  // function updatePolitics(politics) {
  //   var libPercent = politics.Liberal + politics.Green;
  //   var conPercent = politics.Conservative;
  //   var randPercent = politics.Libertarian;

  //   applyTag(libPercent, 'Liberal');
  //   applyTag(conPercent, 'Conservative');
  //   applyTag(randPercent, 'Libertarian');
  // }

  function applyTag(percent, tag){
    var text;

    if (percent >= .34 && percent < .5) {
      text = 'Maybe ' + tag;
    } else if (percent >= .5 && percent < .8) {
      text = 'Somewhat ' + tag;
    } else if (percent >= .8) {
      text = 'Strongly ' + tag;
    }

    if (text !== undefined) {
      $tag = $('<div></div>');
      $tag.text(text);
      $tag.addClass(tag, 'tag');
      $('.politicsDisplay').append($tag);
    }
  }

  function updateLinks(related) {
    var relatedTitles = [];
    var relatedLinks = [];
    // console.log(related.stories[0].links);
    related.stories.map(function(story) {
      relatedTitles.push(story.title);
      relatedLinks.push(story.links.permalink);
    });
    // console.log(relatedTitles, 'titles in update links');
    // console.log(relatedLinks, 'links in update links');
    var linksTable = $('<table></table>').addClass('table');
    relatedLinks.map(function(link, index) {
      var linkEntry = $('<tr></tr>').addClass('tr').append("<a href=" + link + ">" + relatedTitles[index].replace('"', '') + "</a><br/>");
      linksTable.append(linkEntry);
      // console.log(relatedTitles[index]);
    });
    $('.related-articles').append(linksTable);

  }

  //add click handler

  function highlightSentiment(sentence, i, score) {
    var colorSentiment = function(score) {
      //range -1.00 to 1.00 (200 possible values 199 steps)
      //approx it to 1-1 match.
      console.log(score);
      var r = 255;
      var g = 0;
      var b = 0;
      score = score * 100 + 100;
      r -= score;
      g += score;
      return "rgb(" + r + "," + g + "," + b + ")";
    };

    var message = {
      method: 'highlightSentiment',
      sentence: sentence,
      i: i,
      style:{
        atr:'background-color',
        value: colorSentiment(score)
      }
    };
    portToBackground.postMessage(message);
  }


  function handleHighlightCommand() {
    var message = { method:'highlightContent', modes:[] };
    //list of all modes:
    var allModes = ['metrics', 'quotations', 'extreme'];
    //structure the mode
    allModes.forEach(mode => {
      if(document.getElementById(mode).checked){
        message.modes.push(mode);
      }
    });
    portToBackground.postMessage(message);
  };

  // The following will open a connection with the active tab
  // when the extension is open
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var portToBackground = chrome.tabs.connect(tabs[0].id, {name: "background"});
    window.portToBackground = portToBackground; //export the port object
    chrome.commands.onCommand.addListener(function(command) {
      if(command === 'getUserSelectedText') {
        portToBackground.postMessage({method: "getUserSelectedText"}); //don't post it to server
      }
    });
  });

  chrome.runtime.onConnect.addListener(function(portToExtension) {
    portToExtension.onMessage.addListener(handleMessage);
  });

  function handleMessage(msg) {
    console.log(msg);
    popupAction[msg.method](msg);
  };

  const popupAction = {
    getUserSelectedText: function(msg) {
      // chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
      //     postToDrive(msg.scraped, token);
      //   });
      postToServer(msg).done(populatePanel).fail(failToPopulate);
    },
    getContentAndUrl: function(msg) {
      postToServer(msg).done(populatePanel).fail(failToPopulate);
    },
  };

  function populatePanel(json) {
    // Handle all panel population from the extension endpoint here
    var emotions = json.emotion ?
      json.emotion.docEmotions :
      makeRandomEmotions();
    updateEmotions(emotions);
    updateRadialGraph(emotions);

    var sentences = json.sentiment ?
      json.sentiment.sentences :
      dummySentences;

    renderSentimentGraph(sentences, highlightSentiment);

    // console.log('politics', json.politics);
    // updatePolitics(json.politics);

    if ((json.fake.rating.score + '') === '0') {
      rating = '<div><div style="float:left"><img src="approved.png"></div><div style="float:left; width: 250px;">This page does not exist in our Fake News blacklist.</div></div>';
    } else if ((json.fake.rating.score + '') === '100') {
      rating = '<div><div style="float:left;"><img src="blacklisted.png"></div><div style="float:left; width: 250px; color:red; margin-top: 0px;">WARNING: This page is hosted on a domain that has been blacklisted because of fake news.</div></div>';
    }
    $('.reliability.component').append(rating);
    $('.flesch.component').append(json.flesch);
    $('#spinner').remove();
  }

  function failToPopulate(xhr, status, errorThrown) {
    alert('fail');
    console.log( 'Error: ' + errorThrown );
    console.log( 'Status: ' + status );
    console.dir(xhr);
  }

  function postToServer(msg) {
    return $.ajax({
      url: 'http://localhost:8000/api/ext',
      type: 'POST',
      data: msg.data,
      dataType: 'json'
    });
  };

  //hook it up with google docs.
  function postToDrive(content, token) {
    console.log(token);
    return $.ajax({
      url:'https://www.googleapis.com/drive/v3/files/1NQU1qee00IIrFtdkfwIgEjlyIqf4WsH7rqVs2KXGy9g',
      headers: {
        "Authorization": "'" + 'Bearer' + token + "'"
      },
      type:'PATCH',
      uploadType: 'media',
      contentType: 'text/plain',
      data: content
    });
  }

});

