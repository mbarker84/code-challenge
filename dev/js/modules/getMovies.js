require('./helpers');

const $container = document.querySelector('[data-container]');
const $filterWrapper = document.querySelector('[data-filter]');
const $ratingInput = document.querySelector('[data-rating]');
const $currRating = document.querySelector('[data-current-rating]');
let $listItems;
const apiKey = 'ef3830b0bf3e47ea40628844dfe93dfb';

// Get the JSON data
const requestUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}`;
const genresUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;

// Create an array of the requests so we can execute them in turn
const requestsArray = [requestUrl, genresUrl];

// Create new empty array for movie genres [2]
const genresArray = [];

// Array for selected genres
const $selectedGenres = [];

// Create a new variable to which we’ll assign the results of the API query. This will be a list of all available movies.
let allMovies;

// Create a new variable for array of genres
let allGenres;

// Get the current value of the rating input
let currentMinRating;

// The results currently showing at any one time.
let visibleItems = [];

// Variable to test if any items are checked [1]
let itemsChecked;

// Make array of all available genres available globally
let $genres;

/* This function gets a list of all genres names and ids from the genres query and cross-references
it against the genre IDs in `genresArray` to determine which genre inputs should be available for our filter component. */
const listGenres = (obj) => {
  // Assign the array of genre IDs to a variable
  $genres = obj.genres;

  // Map over the array of genres IDs. If the genre ID matches any of the movies returned by the request, create a corresponding <input> to add to the filter component
  const filterItems = $genres.map((el) => {
    if (genresArray.includes(el.id)) {
      return `<div class="filter__input-group">
      <input type="checkbox" data-id="${el.id}" name="genre" data-input>
      <label for="${el.id}"></label>${el.name}</label>
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

let $ratedItems;

// Function to populate the page with a list of results of the query
const populatePage = (obj) => {
  // Get the current rating input value and show the value
  currentMinRating = parseFloat($ratingInput.value);
  const ratingValue = Number(currentMinRating.toFixed(1));
  $currRating.innerHTML = `${currentMinRating}`;

  // Sort by popularity and assign the array of results to a variable
  const $items = obj.sort((a, b) => a.popularity - b.popularity).reverse();

  // Create a new array for items over the current rating value
  $ratedItems = [];

  // Any items with rating higher than or equal to current rating input value, push into the array
  $items.map((el) => {
    if (el.vote_average >= ratingValue) {
      $ratedItems.push(el);
    }
  });

  // Remove content if the $container has content from a previous query
  $container.innerHTML = '';

  if ($ratedItems.length > 0) {
    // Loop over the data array and create a list item for each movie as HTML string
    const listItems = $ratedItems
      .map(el => `<li class="movie-list__item" data-item>
            <h2>${el.title}</h2>
            <p>${el.vote_average}</p>
            <p>${el.popularity}</p>
            <p>${el.overview}</p>
            <ul data-genre></ul>
          </li>`)
      .join('');

    // Create a new <ul></ul> and insert the items HTML
    $container.innerHTML = `<ul>${listItems}</ul>`;
  } else {
    // If no results match the filter then display a message.
    $container.innerHTML = '<p>Sorry, no results found</p>';
  }

  // append genres
  if (allGenres) {
    appendGenres(allGenres);
  }
};

const getSelectedInputs = () => {
  // Only get this when clicked, as these elements are dynamically created
  const inputsArray = [...document.querySelectorAll('[data-input]')];

  // Set variable to false by default [1]
  itemsChecked = false;

  inputsArray.map((el) => {
    const genreId = parseInt(el.dataset.id);

    // [1] If any input is checked, set to true
    if (el.checked) {
      itemsChecked = true;
    }

    /* If an input is checked and $selectedGenres array doesn’t already include it, push it to the array.
    Otherwise, if not checked remove it from the array if necessary. */
    if (el.checked && !$selectedGenres.includes(genreId)) {
      return $selectedGenres.push(genreId);
    } else if (!el.checked && $selectedGenres.includes(genreId)) {
      $selectedGenres.splice($selectedGenres.indexOf(el), 1);
    }
  });
};

// The clickHandle for filter inputs
const genresclickHandle = (e) => {
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
  } else {
    populatePage(allMovies);
  }
};

// Add genres to displayed movies
const appendGenres = (obj) => {
  $listItems = [...document.querySelectorAll('[data-item]')];
  // Find the genres for each listed movie
  $ratedItems.map((el, index) => {
    const movieGenres = el.genre_ids
      .map(i => `<li>${obj.find(item => item.id === i).name}</li>`)
      .join('');

    console.log($listItems[index]);
    const genreWrapper = $listItems[index].querySelector('[data-genre]');
    genreWrapper.innerHTML = movieGenres;
  });
};

// Because our inputs are being created dynamically we have to delegate events to the parent
$filterWrapper.addEventListener('click', genresclickHandle);

// The function we want to perform on each item in the requestsArray
const requestFunction = (url, index) => {
  // New request
  const request = new XMLHttpRequest();

  // Convert the JSON into a JS object
  request.open('GET', url);
  request.responseType = 'json';

  request.onreadystatechange = () => {
    // Wait for the request to respond, then do stuff if request returns without errors
    if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
      const dataObject = request.response;

      if (index === 0) {
        allMovies = dataObject.results;
        // get array of available genres and create filter component
        getGenresArray(allMovies);
        // for the first request in the array, populate the page
        populatePage(allMovies);
      } else if (index === 1) {
        // for the second item in the array (genresUrl) create filter
        allGenres = dataObject.genres;
        listGenres(dataObject);
        // Add genres to displayed movies
        appendGenres(allGenres);
      }
    }
  };
  request.send();
};

// Loop over the array, execute function
requestsArray.forEach((item, index) => {
  requestFunction(item, index);
});
