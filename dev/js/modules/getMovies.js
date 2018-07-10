require('./helpers');

const $container = document.querySelector('[data-container]');

// Get the JSON data
const requestUrl =
  'https://api.themoviedb.org/3/discover/movie?api_key=ef3830b0bf3e47ea40628844dfe93dfb';

// Convert the JSON into a JS object
const request = new XMLHttpRequest();

request.open('GET', requestUrl);
request.responseType = 'json';
request.send();

// Wait for the response to return, then populate the page
request.onload = () => {
  const dataObject = request.response;
  populatePage(dataObject);
};

const populatePage = (obj) => {
  // Return the array of results
  const $items = obj.results;
  // Loop over the data array and create a list item for each movie
  const $listItems = $items.map(el =>
    `<li>
      <h2>${el.title}</h2>
      <p>${el.vote_average}</p>
    </li>`);

  $container.innerHTML = $listItems.join('');
  console.log(obj);
};
