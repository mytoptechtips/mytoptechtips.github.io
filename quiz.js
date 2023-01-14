var guesses = 0;
var movieDetails;
document.addEventListener('DOMContentLoaded', function() {

    // Set up event listener for submit button
    startQuiz(); // Start the quiz
    document.getElementById('submit-button').addEventListener('click', function(event) {

        event.preventDefault(); // Prevent form submission
       promptUser(movieDetails, ++guesses); 
    });
});

document.getElementById('play-again-button').addEventListener('click', function(event) {

    event.preventDefault(); // Prevent form submission
    startQuiz();
});

  // Step 1: Call API to get list of movie IDs

  async function getMovieIds() {
    // Initialize variables
    var movieIds = [];

    // Loop through pages 1 to 10
    for (var i = 1; i <= 10; i++) {
        // Call API and add page parameter
        var response = await fetch('https://api.themoviedb.org/3/discover/movie?api_key=3f2af1df74075e194bc154e7f3233e60&language=en-US&sort_by=vote_count.desc&include_adult=false&include_video=false&with_watch_monetization_types=flatrate&page='+i, {
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

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
    return formattedDate;
}

function startQuiz() {
    // Initialize variables
    var movieIds = [];
    var movieId;
  

    document.getElementById('submit-button').style.display="inline-block";

    document.getElementById('results').innerHTML = "";
    var boxes = document.querySelectorAll(".box.visible");
    for (var i = 0; i < boxes.length; i++)  {
        boxes[i].classList.remove("visible");
    }
    guesses = 0;
 
    getMovieIds()
    .then(function(movieIds) {
        console.log(movieIds);
        // Step 2: Choose a random movie ID
        movieId = movieIds[Math.floor(Math.random() * movieIds.length)];
        // Step 3: Call API to get movie details
        fetch('https://api.themoviedb.org/3/movie/' + movieId + '?api_key=3f2af1df74075e194bc154e7f3233e60', {
            method: 'GET',
            mode: 'cors',
            cache: 'default'
        }).then(function(response) {
            return response.json();
        }).then(function(response) {
            movieDetails = response;
            // Step 4: Call API to get movie credits
            fetch('https://api.themoviedb.org/3/movie/' + movieId + '/credits?api_key=3f2af1df74075e194bc154e7f3233e60', {
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
            for (var i = 0; i < movieDetails.title.length; i++) {
                var answerChar = movieDetails.title[i];
                var input = document.createElement("input");
                input.setAttribute("size", "1");
                input.setAttribute("maxlength", "1");
                input.setAttribute("type", "text");
                input.setAttribute("class", "guess-letter");
                if (answerChar.match(/[^a-zA-Z0-9]/)) {
                    input.classList.add("punctuation");
                    input.value=answerChar;
                    input.setAttribute("disabled", true)
                }
                input.addEventListener("focus", function(event) {
                    event.target.select();
                });
                guessContainer.appendChild(input);
            }
            // Add event listeners for input boxes
            var inputBoxes = document.getElementsByClassName("guess-letter");
            for (var i = 0; i < inputBoxes.length; i++) {
                inputBoxes[i].addEventListener("input", function(event) {
                    var nextBox = event.target.nextElementSibling;
                    event.target.classList.remove("wrong");
                    event.target.classList.remove("correct");
                    event.target.classList.remove("neutral");

                    if (event.target.value.length === 1 && nextBox !== null) {
                        nextBox.focus();
                    }
                });
            }


        });
    })
}
function  showPlayAgain() {
    document.getElementById('play-again-button').style.display="inline-block";
    document.getElementById('submit-button').style.display="none";
  
    document.getElementById('guess').style.display="none";
    document.getElementById('guess-label').style.display="none";

}
function revealPicture() {
    var boxes = document.querySelectorAll(".box:not(.visible)");
    for (var i = 0; i < boxes.length; i++)  {
        boxes[i].classList.add("visible");
    }
}
function showCorrectResult(movieDetails) {
    document.getElementById('results').innerHTML += '<br/><br/><br/>You guessed correctly! The movie was: ' + movieDetails.title;
    
    var inputBoxes = document.querySelectorAll(".guess-letter:not(.correct):not(.punctuation) ");
    for (var i = 0; i < inputBoxes.length; i++) {
            inputBoxes[i].classList.add("correct");
    }
    
    revealPicture();
    showPlayAgain();
}

function promptUser(movieDetails, guesses) {
    // Check if user has used all their guesses
    var inputBoxes = document.getElementsByClassName("guess-letter");
    if (guesses >= 5) {
        // Display correct answer
        document.getElementById('results').innerHTML += '<br/><br/>The correct answer was: '  + movieDetails.title;   ;
        for (var i = 0; i < inputBoxes.length; i++) {
            inputBoxes[i].value=movieDetails.title[i];
            if (!inputBoxes[i].classList.contains("punctuation")  ) {
                inputBoxes[i].classList.remove("wrong");
                inputBoxes[i].classList.add("correct");
            }
        }
        guesses=0;
        revealPicture();
        showPlayAgain();
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
            var visibleBox = Math.floor(Math.random() * boxes.length);
            boxes[visibleBox].classList.add("visible");


            if (guesses > 0 ) {
                for (var i = 0; i < inputBoxes.length; i++) {
                    if (!inputBoxes[i].classList.contains("punctuation")  ) {
                    inputBoxes[i].classList.remove("correct");
                    inputBoxes[i].classList.remove("wrong");
                    
                    if (movieDetails.title[i].toLowerCase() == inputBoxes[i].value.toLowerCase() ) {
                        inputBoxes[i].classList.add("correct");
                    } else {
                        inputBoxes[i].classList.add("wrong");
                    }
                    }
                }
            }
            guesses++;
            // Give hint based on number of guesses
            switch (guesses) {
                case 1:
                    // Display release date and list of genres
                    var genreString = '';
                    for (var i = 0; i < movieDetails.genres.length; i++) {
                        genreString += movieDetails.genres[i].name + ', ';
                    }
                    genreString = genreString.slice(0, -2); // Remove trailing comma
                    document.getElementById('results').innerHTML += '<p>Hint 1: The movie was released on ' + formatDate(movieDetails.release_date) + ' and is a ' + genreString + ' movie.'+ '</p>';
                    break;
                case 2:
                    // Display first two cast members
                    document.getElementById('results').innerHTML += '<p>Hint 2: The movie stars ' + movieDetails.credits.cast[0].name + ' and ' + movieDetails.credits.cast[1].name + '.'+'</p>';
                    break;
                case 3:
                    // Display movie tagline
                    document.getElementById('results').innerHTML += '<p>Hint 3: The movie\'s tagline is: ' + movieDetails.tagline+ '</p>';
                    break;
                case 4:
                    // Display movie director
                    for (var i = 0; i < movieDetails.credits.crew.length; i++) {
                        if (movieDetails.credits.crew[i].job === 'Director') {
                            document.getElementById('results').innerHTML += '<p>Hint 4: The movie was directed by ' + movieDetails.credits.crew[i].name + '.' +'</p>';
                            break;
                        }
                    }
                    break;
                case 5:
                    // Get the first two character names
                    document.getElementById('results').innerHTML += '<p>Hint 5: Two characters in the film are :  ' + movieDetails.credits.cast[0].character + ' and ' + movieDetails.credits.cast[3].character + '.'+'</p>';
                    break;
            }
            // Prompt user again
           // promptUser(movieDetails, guesses);
        }
    }
}
