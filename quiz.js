<html>
<head>
    <meta name="viewport" content=" user-scalable=no" />
    <title>Movie Quiz v3.9</title>
    <style>
        @media (prefers-color-scheme: dark) {
            :root {
                --background-color: black;
                 --foreground-color: white;
            }
        }
        body {
            padding-left:30px;
            padding-right:30px;
            background-color: var(--background-color);
        }
        * { font-family:Arial;
             font-size: 1rem;
        }

        h1, label, input,
        h1 > span {
            font-size : 1.5rem; margin : 5px
        }
        h1 {
            text-align:center;  
        }
        input {
            text-transform: uppercase;
            margin-bottom:5px; margin-left:3px;margin-right:3px;
            padding:0;
        }
        p {
         
    font-size: 28px;
    line-height: 30px;

        }
     
        .wrong {
            background-color:red;
            color:white;
        }
        .correct {
            background-color:green;
            color:white;
        }
        #results .correct {
            padding:20px;
            margin-right:30px;
        }
        #results .incorrect {
            padding:20px;
            background-color : blue;
            color:white;
            margin-right:30px;
        }
        
        .neutral {
            background-color: white;
            color:black;
        }
        .punctuation {
            border:none;
            background-color:var(--background-color);
        }
        .guess-letter.punctuation.line-wrap {
            width : 100%;
            height:0;

        }


        
        .guess-letter,
        .tile-letter {
            width: 3ch;
            line-height: 40px;
            font-size: 32px;
            text-align: center;

        }

        button {
            font-size:2rem;
            margin-right:30px;
            margin-top:20px;
            margin-left:30px;
            padding:20px;
            border-radius:20px ; 

        }

        .guess-letter:focus {
            background-color: #f0f0f0;
            border: 2px solid #4CAF50;
            text-shadow: 0 0 5px #4CAF50;
        }
        #results {
            max-height: 40%;
        }   

        .wrapper {
            display:grid;
            grid-template-columns: 3fr 1fr;
        }
        .guess-letter.start-new-line::before{
            content: "\a";
            white-space: pre;
        }
        #submit-button { float:left}
        #play-again-button { float:right}

        .scoreboard {
            background:silver;

        }
        #scoreHeader {
            font-size:34px;
            text-align: center;
            color: var(--foreground-color);
        }
        #score {
            font-size:80px;
            border-radius:50%;
            border:5px solid silver;
            display:grid;
            place-items:center;
            line-height:200px;
        }
        #movie-poster:has(#image.zoomed) {
            border: 10px solid red;
        }
    </style>
    <style>
        #movie-poster {
            position:relative;
            width:640px;
            height:360px;
      
        }
        #image {
             width: 640px;
        }

        #overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 640px;
            height: 100%;
            display: flex;
            flex-wrap: wrap;
        }

        .box {
            width: 25%;
            height: 25%;
            opacity: 1;
            background-color: var(--background-color);
            outline:1px solid silver;
        }

        .box.visible {
            opacity: 0.1;
        }




        #image {
            width: 640px;
            clip-path: inset(0px 0px 0px 0px);
        }

        .box.selected {
            clip-path: inset(0px 0px 0px 0px);
        }

        

    </style>
    <style>
        /* https://codepen.io/alvaromontoro/pen/LYjZqzP */
        @keyframes growProgressBar {
            0%, 33% { --pgPercentage: 0; }
            100% { --pgPercentage: var(--value); }
            }
            @keyframes shrinkProgressBar {
            0%, 33% { --pgPercentage: 100; }
            100% { --pgPercentage: var(--value); }
            }


            @property --pgPercentage {
            syntax: '<number>';
            inherits: false;
            initial-value: 100;
            }

            div[role="progressbar"] {
            --size: 12rem;
            --fg: #369;
            --bg: #def;
            --pgPercentage: var(--value);
            animation: shrinkProgressBar 5s 1 backwards;
         
            width: var(--size);
            height: var(--size);
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: 
                radial-gradient(closest-side, white 80%, transparent 0 99.9%, white 0),
                conic-gradient(var(--fg) calc(var(--pgPercentage) * 1%), var(--bg) 0)
                ;
            font-family: Helvetica, Arial, sans-serif;
            font-size: calc(var(--size) / 5);
            color: var(--fg);
            }

            div[role="progressbar"]::before {
            counter-reset: percentage var(--value);
            content: counter(percentage) '';
            }



    </style>
    <style>
        body.loading .loading {
          display:grid;
          place-items:center;
          height:100vh;
        }
        body:not(.loading) .loading {
            display:none;
        }
        .loading p {
            font-size: 60px;
            line-height: 60px;
            color : var(--foreground-color);
        }
        body.loading .wrapper,
        body.loading #results,
        body.loading #quiz-form {
            display:none;
        }
        .titleHeading input {line-height:100px; height:100px;font-size:90px;padding:0;}
        .pageHeading input {line-height:36px;font-size:25px; padding:0;}
        </style>
    <style>
        .wrapper {
            display:grid;
            grid-template-areas: "header header header"
                                    "poster poster scoreboard"
                                    "results results results"
                                    "form form form";
         grid-template-rows: 1fr 4fr 3fr 3fr;
        }    
        h1 {
            grid-area: header;
            align-self:center;
        }
        #movie-poster { grid-area: poster}
        #scoreboard { grid-area: scoreboard}
        #results { grid-area : results}
        #quiz-form { grid-area : form}
    

        #results {
            width: 100%;
            display: flex;
            overflow-x: scroll;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            min-height: 300px;
            gap:20px;
        }

        #results p {
            flex: 0 0 90%;
            scroll-snap-align: start;
            font-size:40px;
            line-height:40px;
            display:grid;
            place-items:center;
            padding:40px;
            border-radius:20px;
            border:1px solid silver;
            font-weight:bold;
        }
        #results p:nth-child(1) {
            background-color:brown;
            color:white;
        }
        #results p:nth-child(2) {
            background-color: darkblue;
            color:white;
        }
        #results p:nth-child(3) {
            background-color:darkgreen;
            color:white;
        }
        #results p:nth-child(4) {
            background-color:black;
            color:white;
        }
        #results p:nth-child(5) {
            background-color:blueviolet;
            color:white;
        }



    </style>
</head>
<body class="loading">
  
    <div class="loading">
        
             <div class="titleHeading">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="G">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="U">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="E">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="S">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="S">
                <br/>
                <input size="1" maxlength="1" type="text" class="tile-letter punctuation" value="">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="T">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="H">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="E"> 
                <input size="1" maxlength="1" type="text" class="tile-letter punctuation" value=""><br/>
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="T">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="I">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="T">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="L">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="E"><br/>     
            </div>
            <p>Getting started... please wait </p>
    </div>
    <div class="wrapper">        <h1>
            <div class="pageHeading">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="G">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="U">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="E">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="S">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="S">
                <input size="1" maxlength="1" type="text" class="tile-letter punctuation" value="">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="T">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="H">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="E"> 
                <input size="1" maxlength="1" type="text" class="tile-letter punctuation" value="">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="T">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="I">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="T">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="L">
                <input size="1" maxlength="1" type="text" class="tile-letter correct" value="E">  
            </div>
        </h1>
         <div id="movie-poster">
            <img id="image" src="https://image.tmdb.org/t/p/original/hqh5O4KssfJWI62HGAgrjHXbxhD.jpg">
            <div id="overlay">
                <div class="box"></div> <div class="box"></div> <div class="box"></div> <div class="box"></div>
                <div class="box"></div> <div class="box"></div> <div class="box"></div> <div class="box"></div>
                <div class="box"></div> <div class="box"></div> <div class="box"></div> <div class="box"></div>
                <div class="box"></div> <div class="box"></div> <div class="box"></div> <div class="box"></div>

                <!-- Add more boxes as needed -->
            </div>
        </div>
        <div id="scoreboard">
            <div id="scoreHeader">Score:</div>
            <!-- div id="score"></div --> 
            <div id="score" role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100" style="--value:65"></div>
        </div>
    
        <div id="results"></div>
      
        <form id="quiz-form">
          <!-- label id="guess-label" for="guess-container">Guess the movie title:</label><br -->
         
          <div id="guess-container">
          </div>
          <button type="submit" id="submit-button">Guess</button>
          <button type="button" id="play-again-button">Play Again</button>
        </form> 

    </div>







    <script>
   
    </script>

    <script src="quiz.js"></script>
</body>
</html>
