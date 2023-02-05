var guesses = 0;
var movieDetails;
var category="movie";
var categoryLabel="movie";
var score=110;
var zoomScale = 8;
var specificId;
var sound=false;
var defaultImageWidth=800;
var filters = {
        "60s" : "&primary_release_date.gte=1960&primary_release_date.lte=1969",
        "70s" : "&primary_release_date.gte=1970&primary_release_date.lte=1979",
        "80s" : "&primary_release_date.gte=1980&primary_release_date.lte=1989",
        "90s" : "&primary_release_date.gte=1990&primary_release_date.lte=1999",
        "00s" : "&primary_release_date.gte=2000&primary_release_date.lte=2009",
        "10s" : "&primary_release_date.gte=2010&primary_release_date.lte=2019"

    }
var movieIds = [];

function getPreferences() {
    var preferences;
    try {
        preferences = JSON.parse(localStorage.getItem("preferences") || "{}" );
        }
        catch (ex) {
            preferences = {};
            savePreferences(preferences);
        }
    return preferences;
}
var preferences = getPreferences();

function setTheme(preferences) {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");
    document.body.classList.add(  preferences.theme );
    document.body.classList.add(  preferences.largeText ? "large-text" : "" );
    

}
setTheme(preferences);
function setScale() {
    if (preferences && preferences.mode == "hard") {
        zoomScale = 12;
    } else {
        zoomScale = 4;
    }
}

setScale();
sound = preferences.sound;

function createOverlay() {
    
    ovl = document.getElementById ('overlay');
    ovl.innerHTML = "";
    ovl.style="--colcount:"+zoomScale+";--rowcount:"+zoomScale;
    for (var i=0 ; i < zoomScale * zoomScale ; i++ ) {
        b = document.createElement('DIV');
        b.classList.add("box");
        if (i < zoomScale || i >= zoomScale * (zoomScale - 1) || i % zoomScale === 0 || i % zoomScale === zoomScale - 1) {
            b.classList.add("outer");
            scoreDelta = zoomScale < 6 ? -10 : -3;   
        } else {
            scoreDelta = zoomScale < 6 ? -25 : -10;
        }
        b.style.setProperty("--data-score-delta", "\""+scoreDelta+ "\"");

        
        ovl.appendChild(b);

    }

    setupBoxAnimation();
}
createOverlay() ;


function setPreferencesInMenu() {

    document.getElementById("modeSetting").checked= (preferences.mode == "hard") ;
    document.getElementById("themeSetting").checked = (preferences.theme == "dark") ;
    document.getElementById("soundSetting").checked= (preferences.sound) ;
    document.getElementById("largeTextSetting").checked= (preferences.largeText) ;
     
}
/*
function censorWords(movieTitle, message) {
    const titleWords = movieTitle.toUpperCase().split(" ");
    const messageWords = message.toUpperCase().split(" ");
    for (let i = 0; i < messageWords.length; i++) {
      if (titleWords.includes(messageWords[i])) {
        messageWords[i] = "*".repeat(messageWords[i].length);
      }
    }
    return messageWords.join(" ");
}
*/
const commonWords = ['THIS', 'IT', 'ON', 'OF', 'AND', 'IS', 'IN', 'TO', 'FOR', 'WITH', 'THE', 'A'];
function censorWords(movieTitle, message) {
  const titleWords = movieTitle.toUpperCase().split(" ");
  const messageWords = message.split(" ");
  for (let i = 0; i < messageWords.length; i++) {
    const upperCaseWord = messageWords[i].toUpperCase();
    if (titleWords.includes(upperCaseWord) && !commonWords.includes(upperCaseWord )) {
      messageWords[i] = "*".repeat(messageWords[i].length);
    }
  }
  return messageWords.join(" ");
}

setPreferencesInMenu() ;
const today = new Date();
const imdblink="https://www.imdb.com/title/";
let params = new URLSearchParams(document.location.search)


if (params.get( "tv")!= null  )  {
    category="tv";
    categoryLabel="TV show";
}
let filterParam=params.get("filter");
let filter="";
if (filterParam != null ){
    if (filters[filterParam]) {
        filter = filters[filterParam];
    } 
}
document.body.classList.add("category-"+category);


let randomSeed;

todayDate = today.toISOString().slice(0,10);

lastDatePlayed = localStorage.getItem("lastDatePlayed");

if (!lastDatePlayed || lastDatePlayed != todayDate ) {
    randomSeed = todayDate;
} else {
    // include the current time 
    randomSeed = today.toISOString();
}
localStorage.setItem("lastDatePlayed", todayDate);


let randomNumber = new Math.seedrandom(randomSeed);

//document.getElementById("categoryLabel").innerText = categoryLabel;
document.addEventListener('DOMContentLoaded', function() {

    // Set up event listener for submit button

addClickToImage();
addRevealVowels();

    startQuiz(); // Start the quiz

    document.getElementById('submit-button').addEventListener('click', function(event) {

        event.preventDefault(); // Prevent form submission
       promptUser(movieDetails, guesses); 
    });
});


document.getElementById('play-again-button').addEventListener('click', function(event) {

    event.preventDefault(); // Prevent form submission
    
    //remove the specific id 

    if (history.pushState) {
        params.delete("id");
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?"+ params.toString() ;
        window.history.pushState({path:newurl},'',newurl);
    }
    document.getElementById("image").setAttribute("src","");

    startQuiz();
});

  // Step 1: Call API to get list of movie IDs

  async function getMovieIds() {
    // Initialize variables
    const sessionMoviesStr = sessionStorage.getItem("sessionMovies") || "[]";
    const sessionMovies = JSON.parse(sessionMoviesStr);
    if (movieIds.length == 0) {

        // Loop through pages 1 to 20
        for (var i = 1; i <= 20; i++) {
            // Call API and add page parameter
            console.log("Added filter ", filter);
            var response = await fetch('https://api.themoviedb.org/3/discover/'+category+'?api_key=3f2af1df74075e194bc154e7f3233e60'+filter+'&language=en-US&with_original_language=en&sort_by=vote_count.desc&include_adult=false&include_video=false&with_watch_monetization_types=flatrate&page='+i, {
                method: 'GET',
                mode: 'cors',
                cache: 'default'
            });
            var json = await response.json();
            // Save movie IDs to array
        
            for (var j = 0; j < json.results.length; j++) {
                console.log("Batch : "+ i + " : "+ json.results[j].id);
                if (sessionMovies.indexOf(json.results[j].id) < 0 ) {
                    movieIds.push(json.results[j].id);
                }
            }
        
        }
    }

    return movieIds;
}

function addRevealVowels() {
    document.getElementById('reveal-vowels-button').addEventListener('click', function(event) {

        event.preventDefault(); 
        revealVowels();
    });
}
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
    return formattedDate;
}

function revealVowels () {
    var inputBoxes = document.getElementsByClassName("guess-letter");
    score=score -40;
    updateScore();
for (var i = 0; i < inputBoxes.length; i++) {
     if (movieDetails.title[i].match(/[aeiou]/)) {
                    inputBoxes[i].value=movieDetails.title[i];
                    inputBoxes[i].setAttribute("disabled", true);
                      inputBoxes[i].setAttribute("data-correct-guess",movieDetails.title[i]);
                    if (!inputBoxes[i].classList.contains("punctuation")  ) {
                        inputBoxes[i].classList.remove("wrong");
                        inputBoxes[i].classList.remove("neutral");
                        inputBoxes[i].classList.add("correct");
                    }}
                }

                document.getElementById('reveal-vowels-button').style.display = 'none';
}

function saveMovieToSessionStorage(movieId) {
    const sessionMoviesStr = sessionStorage.getItem("sessionMovies") || "[]";
    let sessionMovies = JSON.parse(sessionMoviesStr);
    sessionMovies.push(movieId);
    sessionStorage.setItem("sessionMovies", JSON.stringify(sessionMovies));

}
function removePreviouslyPlayed(movieIds, previouslyPlayed) {
    return movieIds.filter(id => !previouslyPlayed.includes(id));
  }

function wrapInputBoxes() {


   
   const   MAX_CHARS_PER_LINE = Math.floor(document.getElementById("guess-container").offsetWidth / document.getElementsByClassName("guess-letter")[0].offsetWidth )  - 2;

    let letters = document.querySelectorAll(".guess-letter");
    console.log(letters);

    const string = movieDetails.title
   // const MAX_CHARS_PER_LINE = 15;
    let newString = "";
    let line = "";
    let linecount=1;

    string.split(" ").forEach(function(word){
        if ((line + word).length > MAX_CHARS_PER_LINE) {
            newString += line + "\n";
            if (letters[newString.length-1 -linecount]) {
                letters[newString.length-1-linecount].classList.add("line-wrap");
            }
            linecount++;
            line = "";
        }
        line += word + " ";
    });
    newString += line;
    console.log(newString);


}
function startQuiz() {
    // Initialize variables
  
    var movieId;
    if (params.get("id")) {
        specificId = parseInt(params.get("id"));
    } else {
        specificId = null;
    }

    document.getElementById('submit-button').style.display="inline-block";

    document.getElementById('results').innerHTML = "";
    var boxes = document.querySelectorAll(".box.visible");
    for (var i = 0; i < boxes.length; i++)  {
        boxes[i].classList.remove("visible");
    }
    
    resetZoom();
    guesses = 0;
    score = 110;
    document.getElementById('reveal-vowels-button').style.display = 'inline-block';
 
    getMovieIds()
    .then(function(movieIds) {
        console.log(movieIds);
        // Step 2: Choose a random movie ID

        let movieIdx = Math.floor(randomNumber() * movieIds.length);

        movieId = specificId ? specificId : movieIds[movieIdx];
       
        console.log("Found movieId ["+movieId+"] at position "+ movieIdx +"from ["+movieIds.join(" ") +"]" )
        if (history.pushState) {
            params.delete("id");
            params.append("id",movieId);
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?"+ params.toString() ;
            window.history.pushState({path:newurl},'',newurl);
            saveMovieToSessionStorage(movieId);
        }

        // Step 3: Call API to get movie details
        fetch('https://api.themoviedb.org/3/'+category+'/' + movieId + '?api_key=3f2af1df74075e194bc154e7f3233e60&append_to_response=images,credits', {
            method: 'GET',
            mode: 'cors',
            cache: 'default'
        }).then(function(response) {
            return response.json();
        }).then(function(response) {
            setTimeout( function () {document.body.classList.remove("loading");} , 3000 );
            movieDetails = response;
            movieDetails.title = movieDetails.title || movieDetails.name;
            movieDetails.release_date = movieDetails.release_date || movieDetails.first_air_date;
            
            //init the game;
         
            promptUser(movieDetails, guesses);

            /*
            // Step 4: Call API to get movie credits
            fetch('https://api.themoviedb.org/3/'+category+'/' + movieId + '/credits?api_key=3f2af1df74075e194bc154e7f3233e60', {
                method: 'GET',
                mode: 'cors',
                cache: 'default'
            }).then(function(response) {
                return response.json();
            }).then(function(response) {
                movieDetails.credits = response;
                // Step 5: Prompt user to guess movie title
                promptUser(movieDetails, guesses);
            });
            */
            
        }).then (function(data) {
            var backdrops = movieDetails.images.backdrops.filter( (bd) => { return (bd.iso_639_1 == null ) } )
            randomBD = Math.floor(randomNumber() * backdrops.length);

           // var imgSrc="https://image.tmdb.org/t/p/original"+(movieDetails.backdrop_path)  ;
            var imgSrc = "https://image.tmdb.org/t/p/original"+ backdrops[randomBD].file_path;
            document.getElementById("image").setAttribute("src",imgSrc);

       


            var guessContainer = document.getElementById("guess-container");
            guessContainer.innerHTML = "";
            var MAX_PER_LINE=14;
            var currPoss = 1;
            words=movieDetails.title.split(" ");
            for (var i = 0; i < movieDetails.title.length; i++) {
               
                var answerChar = movieDetails.title[i];
                var input = document.createElement("input");
                input.setAttribute("size", "1");
                input.setAttribute("maxlength", "1");
                input.setAttribute("type", "text");
                input.setAttribute("class", "guess-letter");
                input.setAttribute("data-letter-index", i);
                input.setAttribute("id", "guess-letter-"+i);
                input.setAttribute("inputMode", "none");
                if (answerChar.match(/[^a-zA-Z0-9]/)) {
                    input.classList.add("punctuation");
                    input.value=answerChar;
                    input.setAttribute("disabled", true)
                    if (answerChar == " " ) {
                        input.classList.add("space");
                        input.setAttribute("data-char-pos", i );
                    }
                }
                if (currPoss + (movieDetails.title+ " ").slice(i+1).indexOf(" " ) > MAX_PER_LINE ) {
                    input.classList.add("line-wrap");
                    currPoss=0;
                }
                currPoss++;
                input.addEventListener("focus", function(event) {
                    event.target.select();
                });
                guessContainer.appendChild(input);
           
            }



            // Add event listeners for input boxes
            var inputBoxes = document.querySelectorAll(".guess-letter:not(.punctuation) ");
            for (var i = 0; i < inputBoxes.length; i++) {
                
                inputBoxes[i].addEventListener("input", function(event) {
                
                
                    if (event.target.nextElementSibling) {
                        var nextBox = event.target.nextElementSibling;
                        if (nextBox && nextBox.disabled) nextBox = nextBox.nextElementSibling;
                        if (nextBox && nextBox.disabled) nextBox = nextBox.nextElementSibling;
                        if (nextBox && nextBox.disabled) nextBox = nextBox.nextElementSibling;
                        if (nextBox && nextBox.disabled) nextBox = nextBox.nextElementSibling;
    
                    }

                    event.target.classList.remove("wrong");
                    event.target.classList.remove("correct");
                    wrongGuesses = event.target.getAttribute("data-incorrect-guesses") || "";
                    correctGuess = event.target.getAttribute("data-correct-guess") || "";
                    //console.log("Checking Input : " + event.target.value.toUpperCase() )
                    if (wrongGuesses.indexOf(event.target.value.toUpperCase()) > -1 ) {
                        event.target.classList.add("wrong");
                        event.target.classList.remove("neutral");
                    }else {
                        if (correctGuess == (event.target.value.toUpperCase()) ) {
                            event.target.classList.add("correct");
                            event.target.classList.remove("neutral");
                            event.target.setAttribute("disabled", true);
                        }else {
                            event.target.classList.add("neutral");
                        }
                    }


                    if (event.target.value.length === 1  ) {
                        if (nextBox) {
                            nextBox.focus();
                        } else {
                            event.target.classList.remove("active");
                            document.querySelector("#submit-button").focus();
                        }
                    } 
                
                });
             
                inputBoxes[i].addEventListener("keydown", function(event) {
                    if (event.key === "Backspace") {
                        event.preventDefault();
                        // do something, like delete the last character in the input
                        event.target.value=null;
                        event.target.classList.remove("wrong");
                        event.target.classList.remove("correct");
                        event.target.classList.add("neutral");
                        var prevBox = event.target.previousElementSibling;
                        if (prevBox.disabled) prevBox = prevBox.previousElementSibling;
                        if (prevBox.disabled) prevBox = prevBox.previousElementSibling;
                        if (prevBox.disabled) prevBox = prevBox.previousElementSibling;
                        if (prevBox.disabled) prevBox = prevBox.previousElementSibling;
                        prevBox.focus();
                      }
                      
                });
                

               
                    inputBoxes[i].addEventListener("focus", onInputFocus);
                    // Optional: Use if you want to track input changes
                    // made without simple-keyboard
                    //inputBoxes[i].addEventListener("input", onInputChange);
                  
                  

                  
            }
            inputBoxes[0].focus();


        });
    })
}


function  showPlayAgain() {
    document.getElementById('play-again-button').style.display="inline-block";
    document.getElementById('submit-button').style.display="none";
    document.getElementById('reveal-vowels-button').style.display = 'none';
    document.getElementById('hint')?.remove();
  
 //   document.getElementById('guess').style.display="none";
 //   document.getElementById('guess-label').style.display="none";

}
function revealPicture() {
    var boxes = document.querySelectorAll(".box:not(.visible)");
    for (var i = 0; i < boxes.length; i++)  {
        boxes[i].classList.add("visible");
    }
}
function enableShareLink() {

    if (navigator.share ) {

     document.getElementById("shareLink").addEventListener("click", function () {
            navigator.share({
            title: 'Guess the '+category+' Title',
            text: 'Play QuizWordz : ',
            url: document.location.href,
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
            })
        } else {
            document.querySelector("#shareLink").remove();
        }

}
function showCorrectResult(movieDetails) {
    document.getElementById('results').innerHTML += '<p class="correct">Well Done! <br />That is the right answer.  You scored '+score+'.<br /> <span><span id="webshare"></span><a class="imdblink button" target="_blank" href="https://www.imdb.com/title/'+movieDetails.imdb_id+'">View on IMDB</a></span></p>';
    speak("Well Done ! That is the right answer, you scored : "+ score);
    document.querySelector(".guess-letter.active")?.classList.remove("active");
    if (navigator.share) {

        document.getElementById("webshare").innerText = "Share"
        document.getElementById("webshare").addEventListener("click", function () {
        navigator.share({
          title: 'QuizWordz',
          text: 'I got a score of '+score+' today , what can you get ?',
          url: document.location.href,
        })
          .then(() => console.log('Successful share'))
          .catch((error) => console.log('Error sharing', error));
        })
      } else {
        document.getElementById("webshare").style.display="none";
      }


    var inputBoxes = document.querySelectorAll(".guess-letter:not(.correct):not(.punctuation) ");
    for (var i = 0; i < inputBoxes.length; i++) {
            inputBoxes[i].classList.remove("neutral");
            inputBoxes[i].classList.add("correct");
            inputBoxes[i].setAttribute("disabled", true); 
    }
    resetZoom();
    revealPicture();
    showPlayAgain();
    showLastHint();
}


function addClickToImage() {
     // Add event listener to all the box elements
     const boxes = document.querySelectorAll('.box');
     boxes.forEach(box => {
         box.addEventListener('click', function () {
        
            var ovl = document.getElementById("overlay");
            var img = document.getElementById("image");
            if (box.classList.contains("visible")) {                
                // remove the class selected from all the elements
                img.classList.add("zoomed");
                score--;
                updateScore();
                boxes.forEach(b => {
                    b.classList.remove("selected")
                });
                // add the class selected to the current element
                this.classList.add("selected");

                // update the clip path to match the dimensions of the box
                var imageRect = document.getElementById("image").getBoundingClientRect();
                var rect = this.getBoundingClientRect();
                
                console.log(rect);
                console.log(imageRect);
                scale = zoomScale;

                var insetTop = scale*(rect.top - imageRect.top );
                var insetRight = scale*(imageRect.right - rect.right);
                var insetBottom = scale*( imageRect.bottom - rect.bottom);
                
                var insetLeft = scale*(rect.x - imageRect.x);
                
          
                img.style.clipPath = `inset(${1*insetTop}px ${1*(insetRight)}px ${1*(insetBottom)}px ${insetLeft}px)`;
                //img.style.transform = `scale(${scale},${scale})`;
                img.style.marginLeft = -1*insetLeft+"px";
                img.style.marginTop = -1*insetTop+"px";
                img.style.width = defaultImageWidth*scale+"px"    
                ovl.style.display="none";
                } else {
                    box.classList.add("visible");
                    let isOuter = (  box.classList.contains("outer")  ) ; 
                    let scoreDelta = getComputedStyle(box).getPropertyValue('--data-score-delta');
                 
                    if (scoreDelta) { 
                        scoreDelta = parseInt(scoreDelta.replaceAll(/[^0-9-]/g,""))
                    }
                    score=score+ scoreDelta;
                    updateScore();

                }
            });

     });

     var img = document.getElementById("image");
     img.addEventListener('click', function () {
        resetZoom();

  
     });

}
function resetZoom() {
    const boxes = document.querySelectorAll('.box');
    var img = document.getElementById("image");
    img.classList.remove("zoomed");
    boxes.forEach(b => {
        b.classList.remove("selected")
    });
    var ovl = document.getElementById("overlay");
    ovl.style.display="flex";
    img.style.clipPath = `inset(0px 0px 0px 0px)`;
 
    img.style.marginLeft = 0;
    img.style.marginTop = 0;
   // img.style.width = 640+"px"
   img.style.width = "100%";

}
function addHintButtonHandler() {
    document.getElementById("hint").addEventListener("click", function (e) {
       // e.target.remove();
        showHint(guesses);
        score=score-10;
        updateScore();
    })
}
function updateScore() {
//    document.getElementById("score").style = "--value:"+score;
    document.getElementById("score").value = score;
    document.getElementById("scoreDisplay").innerText = score;
}

           // Give hint based on number of guesses
function showHint() {
            if (document.getElementById("hint"))  { document.getElementById("hint").remove() };
            guesses++;
            switch (guesses) {
              case 1:
                  // Display release date and list of genres
                  var genreString = '';
                  for (var i = 0; i < movieDetails.genres.length; i++) {
                      genreString += movieDetails.genres[i].name + ', ';
                  }
                  genreString = genreString.slice(0, -2); // Remove trailing comma
                  msg = ' 1: The '+categoryLabel+' was released on ' + formatDate(movieDetails.release_date) + '. It is a ' + genreString + ' '+category+'.';
                  document.getElementById('results').innerHTML += '<p> ' + msg+ '<button class="hintButton" id="hint" >Next <span class="small">(-10)</span></button></p>';
                 
                  addHintButtonHandler();
                  speak(msg);
                  break;
              case 4:
                  // Display first two cast members
                  msg = '4: The '+categoryLabel +' stars ' + movieDetails.credits.cast[0].name + ' and ' + movieDetails.credits.cast[1].name + '.'
                  msg = censorWords(movieDetails.title, msg);
                  document.getElementById('results').innerHTML += '<p> '+msg+'<button class="hintButton" id="hint" >Next <span class="small">(-10)</span></button></p>';
                
                  addHintButtonHandler();
                  speak(msg);
                   break;
              case 3:
                  // Display movie tagline
                  if (movieDetails.tagline ) {

                  
                    msg = '3: The '+categoryLabel +'\'s tagline is: ' + movieDetails.tagline;
                    msg = censorWords(movieDetails.title, msg);
                  } else {
                     msg = '3: The '+categoryLabel +'\'s overview starts: ' + movieDetails.overview.substr(0,100)+ '...';
                  }
                  document.getElementById('results').innerHTML += '<p> '+msg+'<button class="hintButton" id="hint" >Next <span class="small">(-10)</span></button></p>';
                 
                  addHintButtonHandler();
                  speak(msg);
                  break;
              case 2:
                  // Display movie director
                  if (category == "movie") {
                      
                      for (var i = 0; i < movieDetails.credits.crew.length; i++) {
                          if (movieDetails.credits.crew[i].job === 'Director') {
                              msg='2: The '+categoryLabel +' was directed by ' + movieDetails.credits.crew[i].name + '.';
                          
                              break;
                          }
                      }
                  
                  } else {
                      msg='2: There were a total of '+ movieDetails.number_of_episodes + ' episodes  across '+ movieDetails.number_of_seasons + ' seasons.';
                  }
                  document.getElementById('results').innerHTML += '<p> '+msg  +'<button class="hintButton" id="hint" >Next <span class="small">(-10)</span></button></p>';
                  
                  addHintButtonHandler();
                  speak(msg);
                   break;
              case 5:
                  // Get the first two character names
                  msg='5: Two characters in the '+categoryLabel +' are :  ' + movieDetails.credits.cast[0].character + ' and ' + movieDetails.credits.cast[3].character + '.';
                  msg = censorWords(movieDetails.title, msg);
                  document.getElementById('results').innerHTML += '<p>'+msg+'</p>';
                  speak(msg);
                  document.querySelector('#results p:last-child').scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                  break;
              }
              showLastHint();
 }


function showLastHint() {
    document.querySelector('#results p:last-child').scrollIntoView();
}
function promptUser(movieDetails, guesses) {
    // Check if user has used all their guesses
    var inputBoxes = document.getElementsByClassName("guess-letter");
    if (false) {
        // Display correct answer
        /* 
        document.getElementById('results').innerHTML += '<p class="incorrect">Better Luck next time ! The correct answer was: </p> '  ;
        for (var i = 0; i < inputBoxes.length; i++) {
            inputBoxes[i].value=movieDetails.title[i];
            if (!inputBoxes[i].classList.contains("punctuation")  ) {
                inputBoxes[i].classList.remove("wrong");
                inputBoxes[i].classList.add("correct");
            }
        }
        guesses=0;
        score=110;
        revealPicture();
        resetZoom();
        showPlayAgain();
        */
    } else {
        // Get user's guess
        // var guess = document.getElementById('guess').value;
        // Check if guess is correct
        var guess = "";
       
        for (var i = 0; i < inputBoxes.length; i++) {
            guess += inputBoxes[i].value;
        }
        
        if (guess.toUpperCase() === movieDetails.title.toUpperCase()) {
            // Display success message
                   showCorrectResult(movieDetails);
                   guesses=0;
                   showPlayAgain();
        } else {


            // Increment guesses
            //highlightCorrectCharacters();
            var boxes = document.querySelectorAll(".box:not(.visible) ");
           
            if (boxes.length > 0 ) {
                var visibleBox = Math.floor(randomNumber() * boxes.length);
                boxes[visibleBox].classList.add("visible");
            }

            if (guesses > 0 && guesses < 5) {
                for (var i = 0; i < inputBoxes.length; i++) {
                    if (!inputBoxes[i].classList.contains("punctuation")  ) {
                    inputBoxes[i].classList.remove("correct");
                    inputBoxes[i].classList.remove("wrong");
                    inputBoxes[i].classList.remove("neutral");            
                    if (movieDetails.title[i].toUpperCase() == inputBoxes[i].value.toUpperCase() ) {
                        inputBoxes[i].classList.add("correct");
                        inputBoxes[i].setAttribute("disabled", true);
                        inputBoxes[i].setAttribute("data-correct-guess", inputBoxes[i].value.toUpperCase());
                    } else {
                        inputBoxes[i].classList.add("wrong");
                        var wrongGuesses=  inputBoxes[i].getAttribute("data-incorrect-guesses")|| "" ;

                        inputBoxes[i].setAttribute("data-incorrect-guesses", wrongGuesses+inputBoxes[i].value.toUpperCase())
                    }
                    }
                }
            } 
            if (guesses >= 5)   {
                notice="Better Luck next time ! <br/> The correct answer was: ";
                msg="Better Luck next time !  The correct answer was: "+ movieDetails.title;
                document.querySelector(".guess-letter.active")?.classList.remove("active");
                document.getElementById('results').innerHTML += '<p class="incorrect">'+notice+' <br/><span><span id="webshare"></span><a class="imdblink" target="_blank" href="https://www.imdb.com/title/'+movieDetails.imdb_id+'">View on IMDb</a> </span></p>';
                speak(msg);

                if (navigator.share) {

                    document.getElementById("webshare").innerText = "Share"
                    document.getElementById("webshare").addEventListener("click", function () {
                    navigator.share({
                      title: 'QuizWordz',
                      text: 'I got '+score+' today , what can you get ? #QuizWordz',
                      url: document.location.href,
                    })
                      .then(() => console.log('Successful share'))
                      .catch((error) => console.log('Error sharing', error));
                    })
                  } else {
                    document.getElementById("webshare").style.display="none";
                  }

                for (var i = 0; i < inputBoxes.length; i++) {
                    inputBoxes[i].value=movieDetails.title[i];
                    if (!inputBoxes[i].classList.contains("punctuation")  ) {
                        inputBoxes[i].classList.remove("wrong");
                        inputBoxes[i].classList.add("correct");
                    }
                }
                guesses=0;
                score=110;
                revealPicture();
                resetZoom();
                showPlayAgain();
                showLastHint();
                return;
             }
      
            score=score-10;
            showHint(guesses) 

 

            showLastHint();
            updateScore();
            // Prompt user again
           // promptUser(movieDetails, guesses);
        }
    }
}

function speak(txt) {
    if (sound ) {

        var msg = new SpeechSynthesisUtterance();
        msg.text = txt;
        window.speechSynthesis.speak(msg);
    }
}
enableShareLink();

function openDrawer() {
    var drawer = document.getElementById("drawer");
    drawer.classList.toggle("hidden");
    drawer.classList.toggle("visible");
  }
  document.querySelector(".menu-icon").addEventListener("click", openDrawer);
  document.querySelector(".close-menu").addEventListener("click", openDrawer);


  /* Add listeners for menu items */
  function savePreferences (pref) {
    localStorage.setItem("preferences", JSON.stringify(preferences) );
  }

  document.getElementById("themeSetting").addEventListener("click", function (e) {
    preferences = getPreferences();
    preferences.theme = e.target.checked ? "dark" : "light";
   setTheme(preferences);
    savePreferences(preferences);
  })


  document.getElementById("modeSetting").addEventListener("click", function (e) {
    preferences = getPreferences();
    preferences.mode = e.target.checked ? "hard" : "easy";
    document.body.classList.add(  preferences.mode );
    setScale();
    createOverlay() ;
    addClickToImage();
    savePreferences(preferences);
  })


  document.getElementById("soundSetting").addEventListener("click", function (e) {
    preferences = getPreferences();
    preferences.sound = e.target.checked ? true : false;
    sound = preferences.sound;
    if (sound) {
     
        speak(document.querySelector('#results p:last-child').innerText);
    } else {
        window.speechSynthesis.cancel();
    }
    savePreferences(preferences);
  })

  document.getElementById("largeTextSetting").addEventListener("click", function (e) {
    preferences = getPreferences();
    preferences.largeText = e.target.checked ? true : false;
    largeText = preferences.largeText;
    if (largeText) {
     
        document.body.classList.add("large-text");

    } else {
          document.body.classList.remove("large-text");
    }
    savePreferences(preferences);
  })



 

  



function animateRandomBox(animationBoxCount) {
    console.log(animationBoxCount);
    if (animationBoxCount > 10) return;

    let boxes=document.querySelectorAll("#overlay .box:not(.animated):not(.visible)")
    console.log("Boxes Length : ", boxes.length)
    let randomIndex = Math.floor(Math.random() * boxes.length);

    const randomBox = boxes[randomIndex];
    randomBox.classList.add("animate");
    randomBox.classList.add("animated");
    animationBoxCount++;
    setTimeout(() => {
        randomBox.classList.remove("animate");
        console.log("Recursing", animationBoxCount)
        animateRandomBox(animationBoxCount);
    
    }, 1000);
}

function setupBoxAnimation () {


const overlay = document.getElementById("overlay");
overlay.addEventListener("animationstart", function () {animateRandomBox(0)  });
}


/* Start speech stuff */


var recognition = new webkitSpeechRecognition();

document.getElementById("listen-button").addEventListener("click", function() {
if (document.getElementById("listen-button").innerText == "Listening") {
	recognition.stop();
  console.log("Button clicked to stop ");
}
else {
	 console.log("Button CLicked to start ");
   recognition.grammars = 
  recognition.start();


 }
});

updateStatus = function (msg) {
  console.log(msg);
    document.getElementById("status").value=msg;
  
    
}
recognition.onend = function() {
  var spokenText = document.getElementById("textarea").value;
  
  document.getElementById("listen-button").innerText="Listen";
  
  console.log("Heard: " + spokenText);
}


// JavaScript for the microphone button and pop-up
/*
document.getElementById("microphone-button").addEventListener("click", function() {
  document.getElementById("popup-layer").style.display = "block";
});
*/

document.getElementById("close-button").addEventListener("click", function() {
  document.getElementById("popup-layer").style.display = "none";
});

// JavaScript for the listen button and Web Speech API

recognition.onresult = function(event) {
  console.log("Got results:",event);
  var spokenText = event.results[0][0].transcript;
  document.getElementById("textarea").value = spokenText;
}


recognition.onstart = function(e) {
 document.getElementById("listen-button").innerText="Listening";
updateStatus ("Starting the recognition");
console.log(e);
  }
recognition.onspeechstart = function(e) {
   updateStatus ("Speech Start");
   console.log(e);
}
recognition.onspeechend = function(e) {
   updateStatus ("Speech End");
   console.log(e);
}

recognition.onsoundstart = function(e) {
 updateStatus ("Sound Start");
 console.log(e);
}
recognition.onsoundend = function(e) {
 updateStatus ("Sound End");
 console.log(e);
}
recognition.onerror = function(e) {
 updateStatus ("Error");
 console.log(e);
}

document.getElementById("update-guess-button").addEventListener("click", function () {
    var text = document.getElementById("textarea").value;
    var inputBoxes = document.getElementsByClassName("guess-letter");
    document.getElementById("popup-layer").style.display = "none";
    for (var i=0 ; i <= text.length && i <= inputBoxes.length; i++) {
       if (text[i])  {inputBoxes[i].value = text[i];}

    }

});
/* End speech stuff */
