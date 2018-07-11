require('./helpers');

const $container = document.querySelector('[data-container]');
const $filterWrapper = document.querySelector('[data-filter]');
const apiKey = 'ef3830b0bf3e47ea40628844dfe93dfb';

// Get the JSON data
const requestUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}`;
const genresUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;

// Create an array of the requests so we can execute them in turn
const requestsArray = [requestUrl, genresUrl];

// Create new empty array for movie genres
const genresArray = [];

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
        // for the first request in the array, populate the page
        populatePage(dataObject);
      } else if (index === 1) {
        // for the second item in the array (genresUrl) create filter
        listGenres(dataObject);
      }
    }
  };
  request.send();
};

// Wait for the response to return, then populate the page
// request.onload = () => {
//   const dataObject = request.response;

//   if (index === 1) {
//     populatePage(dataObject);
//   } else if (index === 2) {
//     console.log('hello');
//   }
// };

// Loop over the array, execute function
requestsArray.forEach((item, index) => {
  requestFunction(item, index);
});

const populatePage = (obj) => {
  // Return the array of results
  const $items = obj.results;

  // Remove content if the $container has content from a previous query
  $container.innerHTML = '';

  $items.map((el) => {
    genresArray.push([...el.genre_ids]);
    console.log([...el.genre_ids]);
  });
  console.log(genresArray);

  if ($items.length > 0) {
    // Loop over the data array and create a list item for each movie as HTML string
    const $listItems = $items
      .map(el =>
        `<li>
        <h2>${el.title}</h2>
        <p>${el.vote_average}</p>
        <p>${el.overview}</p>
      </li>`)
      .join('');

    // Create a new <ul></ul> and insert the items HTML
    $container.innerHTML = `<ul>${$listItems}</ul>`;
  } else {
    // If no results match the filter then display a message
    $container.innerHTML = '<p>Sorry, no results found</p>';
  }
};

const listGenres = (obj) => {
  const $genres = obj.genres;
  const $listItems = $genres
    .map(el => `<input type="checkbox" id="${el.id}">
    <label for="${el.id}"></label>${el.name}</label>`)
    .join('');

  console.log($listItems);

  $filterWrapper.innerHTML = `${$listItems}`;
};
