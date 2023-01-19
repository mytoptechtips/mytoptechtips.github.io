var guesses = 0;
var movieDetails;
var category="movie";
var categoryLabel="movie";
var score=110;
var zoomScale = 4;
var specificId;

const today = new Date();
const imdblink="https://www.imdb.com/title/";
let params = new URLSearchParams(document.location.search)


if (params.get( "tv") )  {
    category="tv";
    categoryLabel="TV show";
}


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
       promptUser(movieDetails, ++guesses); 
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

    startQuiz();
});

  // Step 1: Call API to get list of movie IDs

  async function getMovieIds() {
    // Initialize variables
    var movieIds = [];

    // Loop through pages 1 to 20
    for (var i = 1; i <= 20; i++) {
        // Call API and add page parameter
        var response = await fetch('https://api.themoviedb.org/3/discover/'+category+'?api_key=3f2af1df74075e194bc154e7f3233e60&language=en-US&with_original_language=en&sort_by=vote_count.desc&include_adult=false&include_video=false&with_watch_monetization_types=flatrate&page='+i, {
            method: 'GET',
            mode: 'cors',
            cache: 'default'
        });
        var json = await response.json();
        // Save movie IDs to array
        for (var j = 0; j < json.results.length; j++) {
            movieIds.push(json.results[j].id);
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
    score=score -20;
    updateScore();
for (var i = 0; i < inputBoxes.length; i++) {
     if (movieDetails.title[i].match(/[aeiou]/)) {
                    inputBoxes[i].value=movieDetails.title[i];
                      inputBoxes[i].setAttribute("data-correct-guess",movieDetails.title[i]);
                    if (!inputBoxes[i].classList.contains("punctuation")  ) {
                        inputBoxes[i].classList.remove("wrong");
                        inputBoxes[i].classList.add("correct");
                    }}
                }

                document.getElementById('reveal-vowels-button').style.display = 'none';
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
    var movieIds = [];
    var movieId;
    if (params.get("id")) {
        specificId = params.get("id");
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

        movieId = specificId ? specificId : movieIds[Math.floor(randomNumber() * movieIds.length)];
       
        if (history.pushState) {
            params.delete("id");
            params.append("id",movieId);
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?"+ params.toString() ;
            window.history.pushState({path:newurl},'',newurl);
        }

        // Step 3: Call API to get movie details
        fetch('https://api.themoviedb.org/3/'+category+'/' + movieId + '?api_key=3f2af1df74075e194bc154e7f3233e60', {
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
        }).then (function(data) {

            var imgSrc="https://image.tmdb.org/t/p/original"+movieDetails.backdrop_path;
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
//            setTimeout(5000, wrapInputBoxes);
            // Add event listeners for input boxes
            var inputBoxes = document.querySelectorAll(".guess-letter:not(.punctuation) ");
            for (var i = 0; i < inputBoxes.length; i++) {
                /*
                inputBoxes[i].addEventListener("input", function(event) {
                
                    if (event.target.nextElementSibling) {
                        var nextBox = event.target.nextElementSibling;
                        if (nextBox.disabled) nextBox = nextBox.nextElementSibling;
                        if (nextBox.disabled) nextBox = nextBox.nextElementSibling;
                        if (nextBox.disabled) nextBox = nextBox.nextElementSibling;
                        if (nextBox.disabled) nextBox = nextBox.nextElementSibling;
    
                    }
                    console.log("Removing WRONG");
                    event.target.classList.remove("wrong");
                    event.target.classList.remove("correct");
                    wrongGuesses = event.target.getAttribute("data-incorrect-guesses") || "";
                    correctGuess = event.target.getAttribute("data-correct-guess") || "";
                    console.log("Checking Input : " + event.target.value.toLowerCase() )
                    if (wrongGuesses.indexOf(event.target.value.toLowerCase()) > -1 ) {
                        event.target.classList.add("wrong");
                        event.target.classList.remove("neutral");
                    }else {
                        if (correctGuess == (event.target.value.toLowerCase()) ) {
                            event.target.classList.add("correct");
                            event.target.classList.remove("neutral");
                        }else {
                            event.target.classList.add("neutral");
                        }
                    }


                    if (event.target.value.length === 1 && nextBox ) {
                        nextBox.focus();
                    } 
                });
                */
                /*
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
                */
                inputBoxes[i].addEventListener('keydown', function(e) {
                    var keyCode = e.keyCode;
                    var currentIndex = Array.prototype.indexOf.call(inputBoxes, this);
                    if (keyCode === 8 && this.value === '' && currentIndex !== 0) { // backspace
                        inputBoxes[currentIndex - 1].focus();
                        inputBoxes[currentIndex - 1].value = '';
                        inputBoxes[currentIndex -1 ].classList.remove("wrong");
                        inputBoxes[currentIndex -1 ].classList.remove("correct");
                        inputBoxes[currentIndex -1 ].classList.add("neutral");
                    } else if (keyCode === 8 && this.value === '' && currentIndex === 0) {
                        this.value = '';
                    } else if (keyCode === 39 && this.value !== '' && currentIndex !== inputBoxes.length - 1) { // right arrow
                        inputBoxes[currentIndex + 1].focus();
                    } else if (keyCode === 37 && currentIndex !== 0) { // left arrow
                        inputBoxes[currentIndex - 1].focus();
                    }
                });

                inputBoxes[i].addEventListener('keyup', function(e) {
                    var keyCode = e.keyCode;
                    var currentIndex = Array.prototype.indexOf.call(inputBoxes, this);
                    if( (keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57) ){ // check if the key pressed is a letter or number
                        this.value = e.key;
                        //* now check if the new one is correct or not */
                        inputBoxes[currentIndex ].classList.remove("wrong");
                        inputBoxes[currentIndex ].classList.remove("correct");
                        inputBoxes[currentIndex ].classList.remove("neutral");
                       
                        
                        incorrectGuesses=inputBoxes[currentIndex ].getAttribute("data-incorrect-guesses");
                        correctGuess=inputBoxes[currentIndex ].getAttribute("data-correct-guess");

                        if (correctGuess && e.key.toLowerCase() == correctGuess.toLowerCase()) {
                            inputBoxes[currentIndex ].classList.add("correct");
                            
                        } else {
                            if (incorrectGuesses && incorrectGuesses.toLowerCase().indexOf(e.key.toLowerCase())> -1 )  {
                                inputBoxes[currentIndex ].classList.add("wrong");
                            } else {
                                inputBoxes[currentIndex ].classList.add("neutral");
                            }
                        }


                        if(currentIndex !== inputBoxes.length -1 ){ // check if the input is at the end of the inputs
                            inputBoxes[currentIndex + 1].focus();
                        }else {
                            document.querySelector("button").focus();
                        }
                    }
                });
            }


        });
    })
}
function  showPlayAgain() {
    document.getElementById('play-again-button').style.display="inline-block";
    document.getElementById('submit-button').style.display="none";
    document.getElementById('reveal-vowels-button').style.display = 'none';
  
 //   document.getElementById('guess').style.display="none";
 //   document.getElementById('guess-label').style.display="none";

}
function revealPicture() {
    var boxes = document.querySelectorAll(".box:not(.visible)");
    for (var i = 0; i < boxes.length; i++)  {
        boxes[i].classList.add("visible");
    }
}
function showCorrectResult(movieDetails) {
    document.getElementById('results').innerHTML += '<p class="correct">CORRECT ! <span id="webshare"></span></p>';
    
    if (navigator.share) {

        document.getElementById("webshare").innerText = "Share"
        document.getElementById("webshare").addEventListener("click", function () {
        navigator.share({
          title: 'Guess the '+category+' Title',
          text: 'I got a score of '+score+', what can you get ?',
          url: document.location.href,
        })
          .then(() => console.log('Successful share'))
          .catch((error) => console.log('Error sharing', error));
        })
      }


    var inputBoxes = document.querySelectorAll(".guess-letter:not(.correct):not(.punctuation) ");
    for (var i = 0; i < inputBoxes.length; i++) {
            inputBoxes[i].classList.remove("neutral");
            inputBoxes[i].classList.add("correct");
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
                img.style.width = 640*scale+"px"    
                ovl.style.display="none";
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
    img.style.width = 640+"px"

}
function updateScore() {
    document.getElementById("score").style = "--value:"+score;
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
        
        if (guess.toLowerCase() === movieDetails.title.toLowerCase()) {
            // Display success message
                   showCorrectResult(movieDetails);
                   guesses=0;
                   showPlayAgain();
        } else {


            // Increment guesses
            //highlightCorrectCharacters();
            var boxes = document.querySelectorAll(".box:not(.visible) ");
           
            var visibleBox = Math.floor(randomNumber() * boxes.length);
            boxes[visibleBox].classList.add("visible");


            if (guesses > 0 && guesses < 5) {
                for (var i = 0; i < inputBoxes.length; i++) {
                    if (!inputBoxes[i].classList.contains("punctuation")  ) {
                    inputBoxes[i].classList.remove("correct");
                    inputBoxes[i].classList.remove("wrong");
                    inputBoxes[i].classList.remove("neutral");            
                    if (movieDetails.title[i].toLowerCase() == inputBoxes[i].value.toLowerCase() ) {
                        inputBoxes[i].classList.add("correct");
                        inputBoxes[i].setAttribute("data-correct-guess", inputBoxes[i].value.toLowerCase());
                    } else {
                        inputBoxes[i].classList.add("wrong");
                        var wrongGuesses=  inputBoxes[i].getAttribute("data-incorrect-guesses")|| "" ;

                        inputBoxes[i].setAttribute("data-incorrect-guesses", wrongGuesses+inputBoxes[i].value.toLowerCase())
                    }
                    }
                }
            } 
            if (guesses >= 5)   {
                document.getElementById('results').innerHTML += '<p class="incorrect">Better Luck next time ! <br/> The correct answer was: </p> '  ;
                speak();

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
            guesses++;
            score=score-10;

            // Give hint based on number of guesses
            switch (guesses) {
                case 1:
                    // Display release date and list of genres
                    var genreString = '';
                    for (var i = 0; i < movieDetails.genres.length; i++) {
                        genreString += movieDetails.genres[i].name + ', ';
                    }
                    genreString = genreString.slice(0, -2); // Remove trailing comma
                    document.getElementById('results').innerHTML += '<p> 1: The '+categoryLabel+' was released on ' + formatDate(movieDetails.release_date) + ' and is a ' + genreString + ' '+category+'.'+ '</p>';
      
                    break;
                case 2:
                    // Display first two cast members
                    document.getElementById('results').innerHTML += '<p> 2: The '+categoryLabel +' stars ' + movieDetails.credits.cast[0].name + ' and ' + movieDetails.credits.cast[1].name + '.'+'</p>';
                     break;
                case 3:
                    // Display movie tagline
                    if (movieDetails.tagline ) {

                    
                      document.getElementById('results').innerHTML += '<p> 3: The '+categoryLabel +'\'s tagline is: ' + movieDetails.tagline+ '</p>';
                    } else {
                        document.getElementById('results').innerHTML += '<p> 3: The '+categoryLabel +'\'s overview starts: ' + movieDetails.overview.substr(0,100)+ '...</p>';
                    }
                    break;
                case 4:
                    // Display movie director
                    if (category == "movie") {
                        
                    for (var i = 0; i < movieDetails.credits.crew.length; i++) {
                        if (movieDetails.credits.crew[i].job === 'Director') {
                            document.getElementById('results').innerHTML += '<p> 4: The '+categoryLabel +' was directed by ' + movieDetails.credits.crew[i].name + '.' +'</p>';
                            break;
                        }
                    }
                    
                } else {
                    document.getElementById('results').innerHTML += '<p> 4: There were a total of '+ movieDetails.number_of_episodes + ' episodes  across '+ movieDetails.number_of_seasons + ' seasons.</p>'
                }
                     break;
                case 5:
                    // Get the first two character names
                    document.getElementById('results').innerHTML += '<p> 5: Two characters in the '+categoryLabel +' are :  ' + movieDetails.credits.cast[0].character + ' and ' + movieDetails.credits.cast[3].character + '.'+'</p>';
                    document.querySelector('#results p:last-child').scrollIntoView();
                    break;
            }
            showLastHint();
            updateScore();
            // Prompt user again
           // promptUser(movieDetails, guesses);
        }
    }
}

function speak() {
    var msg = new SpeechSynthesisUtterance();
    msg.text = "Better Luck next time ! The correct answer was "+movieDetails.title ;
    window.speechSynthesis.speak(msg);
}
