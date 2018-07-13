require('./helpers');

const $container = document.querySelector('[data-container]');
const $filterWrapper = document.querySelector('[data-filter]');
const $ratingInput = document.querySelector('[data-rating]');
const $currRating = document.querySelector('[data-current-rating]');
const apiKey = 'ef3830b0bf3e47ea40628844dfe93dfb';

// Get the JSON data
const requestUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}`;
const genresUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;

// Create an array of the requests so we can execute them in turn
const requestsArray = [requestUrl, genresUrl];

// Create new empty array for movie genres
const genresArray = [];

// Create a new variable to which we’ll assign the results of the API query. This will be a list of all available movies.
let allMovies;

// Get the current value of the rating input
let currentMinRating;

// The results currently showing at any one time.
const visibleItems = [];

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

// Function to populate the page with a list of results of the query
const populatePage = (obj) => {
  // Get the current rating input value and show the value
  currentMinRating = parseFloat($ratingInput.value);
  const ratingValue = Number(currentMinRating.toFixed(1));
  $currRating.innerHTML = `${currentMinRating}`;

  // Sort by popularity and assign the array of results to a variable
  const $items = obj.sort((a, b) => a.popularity - b.popularity).reverse();

  // Create a new array for items over the current rating value
  const $ratedItems = [];

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
      .map(el => `<li>
            <h2>${el.title}</h2>
            <p>${el.vote_average}</p>
            <p>${el.popularity}</p>
            <p>${el.overview}</p>
          </li>`)
      .join('');

    // Create a new <ul></ul> and insert the items HTML
    $container.innerHTML = `<ul>${listItems}</ul>`;
  } else {
    // If no results match the filter then display a message. TBH this probably isn’t needed, as all filters *should* show some results.
    $container.innerHTML = '<p>Sorry, no results found</p>';
  }
};

/* This function gets a list of all genres names and ids from the genres query and cross-references
it against the genre IDs in `genresArray` to determine which genre inputs should be available for our filter component. */
const listGenres = (obj) => {
  // Assign the array of genre IDs to a variable
  const $genres = obj.genres;

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

// The clickHandle for filter inputs
const genresclickHandle = (e) => {
  // Get the genre ID from the data-attribute, convert it to a number
  const genreId = parseInt(e.target.dataset.id);

  // Check if any of the movies have a matching genre ID
  allMovies.map((el) => {
    if (e.target.checked && el.genre_ids.includes(genreId) && !visibleItems.includes(el)) {
      // If the input is checked, and the visibleItems array doesn’t already include the item, add them to the array
      visibleItems.push(el);
    } else if (!e.target.checked && el.genre_ids.includes(genreId) && visibleItems.includes(el)) {
      // In the input is not checked, remove items of this genre
      visibleItems.splice(visibleItems.indexOf(el), 1);
    }
  });

  // If any filters are selected show those items, otherwise show all movies
  if (visibleItems.length > 0) {
    populatePage(visibleItems);
  } else {
    populatePage(allMovies);
  }
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
        populatePage(dataObject.results);
      } else if (index === 1) {
        // for the second item in the array (genresUrl) create filter
        listGenres(dataObject);
      }
    }
  };
  request.send();
};

// Loop over the array, execute function
requestsArray.forEach((item, index) => {
  requestFunction(item, index);
});
