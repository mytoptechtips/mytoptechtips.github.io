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

  // Step 1: Call API to get list of movie IDs

  async function getMovieIds() {
    // Initialize variables
    var movieIds = [];

    // Loop through pages 1 to 10
    for (var i = 1; i <= 10; i++) {
        // Call API and add page parameter
        var response = await fetch('https://api.themoviedb.org/3/discover/movie?api_key=3f2af1df74075e194bc154e7f3233e60&language=en-US&sort_by=vote_count.desc&include_adult=false&include_video=false&with_watch_monetization_types=flatrate', {
            method: 'GET',
            mode: 'cors',
            cache: 'default',
            data: {
                page: i // Set page parameter
            }
        });
        var json = await response.json();
        // Save movie IDs to array
        for (var j = 0; j < json.results.length; j++) {
            movieIds.push(json.results[j].id);
        }
    }
    return movieIds;
}

function startQuiz() {
    // Initialize variables
    var movieIds = [];
    var movieId;
  
 
    getMovieIds().then(function(movieIds) {
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
        });
    })
}

function promptUser(movieDetails, guesses) {
    // Check if user has used all their guesses
    if (guesses >= 5) {
        // Display correct answer
        document.getElementById('results').innerHTML += '<br/><br/>The correct answer was: ' + movieDetails.title + ' Guess count = '+ guesses;
    } else {
        // Get user's guess
        var guess = document.getElementById('guess').value;
        // Check if guess is correct
        if (guess.toLowerCase() === movieDetails.title.toLowerCase()) {
            // Display success message
            document.getElementById('results').innerHTML += '<br/><br/><br/>You guessed correctly! The movie was: ' + movieDetails.title;
        } else {
            // Increment guesses
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
                    document.getElementById('results').innerHTML += 'Hint 1: The movie was released on ' + movieDetails.release_date + ' and is a ' + genreString + ' movie.'+ '<br/>';
                    break;
                case 2:
                    // Display first two cast members
                    document.getElementById('results').innerHTML += 'Hint 2: The movie stars ' + movieDetails.credits.cast[0].name + ' and ' + movieDetails.credits.cast[1].name + '.'+'<br/>';
                    break;
                case 3:
                    // Display movie tagline
                    document.getElementById('results').innerHTML += 'Hint 3: The movie\'s tagline is: ' + movieDetails.tagline+ '<br/>';
                    break;
                case 4:
                    // Display movie director
                    for (var i = 0; i < movieDetails.credits.crew.length; i++) {
                        if (movieDetails.credits.crew[i].job === 'Director') {
                            document.getElementById('results').innerHTML += 'Hint 4: The movie was directed by ' + movieDetails.credits.crew[i].name + '.' +'<br/>';
                            break;
                        }
                    }
                    break;
                case 5:
                    // Get the first two character names
                    document.getElementById('results').innerHTML += 'Hint 5: Two characters in the film are :  ' + movieDetails.credits.cast[0].character + ' and ' + movieDetails.credits.cast[3].character + '.'+'<br/>';
                    break;
            }
            // Prompt user again
           // promptUser(movieDetails, guesses);
        }
    }
}
