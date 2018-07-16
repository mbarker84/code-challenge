const $container = document.querySelector('[data-container]');
const $filterWrapper = document.querySelector('[data-filter]');
const $ratingInput = document.querySelector('[data-rating]');
const $currRating = document.querySelector('[data-current-rating]');
const $heading = document.querySelector('[data-heading]');

const apiKey = 'ef3830b0bf3e47ea40628844dfe93dfb';

// Get the JSON data
const requestUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}`;
const genresUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;

/* Create a new variables to which we’ll assign the results of our API queries.
This will be a list of all available movies and all available genres respectively */
let allMovies;
let allGenres;

// Create new empty array for movie genres [2]
const genresArray = [];

// Array for selected genres
let $selectedGenres;

// Get the current value of the rating input
let currentMinRating;

// The results currently showing at any one time.
let visibleItems = [];

// Variable to test if any items are checked [1]
let itemsChecked;

// Array of dynamically created movie listings <li></li>
let $listItems;

// Variable to get items by rating
let $ratedItems;

/* This function gets a list of all genres names and ids from the genres query and cross-references
it against the genre IDs in `genresArray` to determine which genre inputs should be available for our filter component. */
const listGenres = (obj) => {
  // Map over the array of genres. If the genre ID matches any of the movies returned by the request, create a corresponding <input> to add to the filter component
  const filterItems = obj.map((el) => {
    if (genresArray.includes(el.id)) {
      return `<div class="filter__input-group">
      <input type="checkbox" id="${el.id}" data-id="${el.id}" name="genre" data-input>
      <label for="${el.id}">
        <span>${el.name}</span>
      </label>
      </div>`;
    }
  });

  // Insert them into the page
  $filterWrapper.innerHTML = `${filterItems.join('')}`;
};

// Map over the list of genres
const getGenresArray = (items) => {
  items.map((el) => {
    // Map over the array of genre IDs for each movie and add them to the genres array, removing duplicates. This will be the array we use to create the filter component.
    el.genre_ids.map((i) => {
      if (!genresArray.includes(i)) {
        genresArray.push(i);
      }
    });
  });
};

// Fade items in
const fadeIn = () => {
  $listItems.forEach((el, index) => {
    setTimeout(() => {
      el.style.opacity = '1';
    }, index * 150);
  });
};

// Add genres to displayed movies
const appendGenres = (obj) => {
  $listItems = [...document.querySelectorAll('[data-item]')];
  // Find the genres for each listed movie
  $ratedItems.map((el, index) => {
    const movieGenres = el.genre_ids
      .map(i => `<li>${obj.find(item => item.id === i).name}</li>`)
      .join('');

    const genreWrapper = $listItems[index].querySelector('[data-genre]');
    genreWrapper.innerHTML = movieGenres;
  });

  fadeIn();
};

// Function to populate the page with a list of results of the query
const populatePage = (obj) => {
  // Get the current rating input value and show the value
  currentMinRating = parseFloat($ratingInput.value);
  const ratingValue = Number(currentMinRating.toFixed(1));
  $currRating.innerHTML = `${currentMinRating}`;

  // Sort by popularity and assign the array of results to a variable
  const $items = obj.sort((a, b) => a.popularity - b.popularity).reverse();

  // Return an array of items in selected genres with rating higher than or equal to current rating input value
  $ratedItems = $items.filter(el => el.vote_average >= ratingValue);

  // Remove content if the $container has content from a previous query
  $container.innerHTML = '';

  if ($ratedItems.length > 0) {
    // Loop over the data array and create a list item for each movie as HTML string
    const listItems = $ratedItems
      .map(el => `<li class="movie-list__item" data-item>
            <header class="movie-list__header">
              <h3>${el.title}</h3>
              <figure class="movie-list__figure">
                <img src="https://image.tmdb.org/t/p/w500/${el.poster_path}" alt="${el.title}"/>
              </figure>
            </header>
            <p class="movie-list__rating">
              <span>Average rating:</span>
              <span>${el.vote_average}</span>
            </p>
            <ul class="movie-list__genres" data-genre></ul>
          </li>`)
      .join('');

    // Create a new <ul></ul> and insert the items HTML
    $container.innerHTML = `<ul class="movie-list">${listItems}</ul>`;
  } else {
    // If no results match the filter then display a message.
    $container.innerHTML = '<p class="movie-list__no-results">Sorry, no results found</p>';
  }

  // append genres
  if (allGenres) {
    appendGenres(allGenres);
  }
};

const getSelectedInputs = () => {
  // Only get this when clicked, as these elements are dynamically created
  const inputsArray = [...document.querySelectorAll('[data-input]')];

  // Set variable to false by default. [1]
  itemsChecked = false;

  // Empty the array
  $selectedGenres = [];

  // Map over the array and to see if any inputs are checked
  inputsArray.map((el) => {
    // Get the genre ID for each input, convert to a number
    const genreId = parseInt(el.dataset.id);

    /* [1] If any input is checked, set to true. We’re going to use this in the
    clickHandle function to contol whether we display filtered movies or all movies. */
    if (el.checked) {
      itemsChecked = true;
    }

    /* If an input is checked and $selectedGenres array doesn’t already include it, push it to the array */
    if (el.checked && !$selectedGenres.includes(genreId)) {
      return $selectedGenres.push(genreId);
    }
  });
};

// The clickHandle for filter inputs
const clickHandle = (e) => {
  // Check which genre filters are selected
  getSelectedInputs();
  // Empty the array
  visibleItems = [];

  // If all selected genres apply to movie, add to the visibleItems array
  allMovies.map((el) => {
    const isSelected = i => el.genre_ids.includes(i);

    if ($selectedGenres.every(isSelected)) {
      visibleItems.push(el);
    }
  });

  // If any filters are selected populate the page with the filtered items, otherwise show all movies
  if (itemsChecked) {
    populatePage(visibleItems);
    $heading.textContent = 'Selected movies';
  } else {
    populatePage(allMovies);
    $heading.textContent = 'All movies';
  }
};

// ADD EVENTS:
// Because our genre inputs are being created dynamically we have to delegate events to the parent
$filterWrapper.addEventListener('click', clickHandle);
$ratingInput.addEventListener('change', clickHandle);

// API requests
const getAllMovies = (url, callback) => {
  // New request
  const request = new XMLHttpRequest();

  // Convert the JSON into a JS object
  request.open('GET', url);
  request.responseType = 'json';

  request.onreadystatechange = () => {
    // Wait for the request to respond, then do stuff if request returns without errors
    if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
      const dataObject = request.response;

      allMovies = dataObject.results;
      // get array of available genres and create filter component
      getGenresArray(allMovies);
      // for the first request in the array, populate the page
      populatePage(allMovies);
      callback(genresUrl);
    }
  };
  request.send();
};

// Function to be passed in as a callback, so it executes after our first request
const getAllGenres = (url) => {
  const genreRequest = new XMLHttpRequest();

  genreRequest.open('GET', url);
  genreRequest.responseType = 'json';

  genreRequest.onreadystatechange = () => {
    // Wait for the request to respond, then do stuff if request returns without errors
    if (genreRequest.readyState === XMLHttpRequest.DONE && genreRequest.status === 200) {
      const dataObject = genreRequest.response;
      // for the second item in the array (genresUrl) create filter
      allGenres = dataObject.genres;
      listGenres(allGenres);
      // Add genres to displayed movies
      appendGenres(allGenres);
    } else {
      console.log('error occurred');
    }
  };
  genreRequest.send();
};

/* Run the first request function, passing the second in as a callback.
This isn’t ideal as I’m repeating some code in the two functions, could
probably be done better with Promises. */
getAllMovies(requestUrl, getAllGenres);
