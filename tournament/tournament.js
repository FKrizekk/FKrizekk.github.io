// Get the URL parameters from the current page
const params = new URLSearchParams(window.location.search);


let characters = [];
let allMedia = [];
let eliminated = [];
let survivors = [];
let currentDuel = [];
let round = 0;

const charactersPerPage = 50; // Number of characters to fetch per page
let desiredCharacterCount = params.get("charCount");;
let desiredMinAge = params.get("minAge");
let desiredMaxAge = params.get("maxAge");
let desiredGender = params.get("genderFilter");
let desiredSearchType = params.get("searchType");

document.addEventListener("DOMContentLoaded", function () {
    fetchCharacters(desiredCharacterCount);
});

const pause = (time) => new Promise(resolve => setTimeout(resolve, time))
function countdown(seconds, outputElementId) {
    const outputElement = document.getElementById(outputElementId);
    let remainingTime = seconds;

    function updateCountdown() {
        if (remainingTime > 0) {
            outputElement.textContent = `API Cooldown time remaining: ${remainingTime} seconds`;
            remainingTime--;
            setTimeout(updateCountdown, 1000); // Schedule the next update
        }
    }

    updateCountdown(); // Start the countdown
}

let emptyPages = 0;
let result;
// Modify fetchCharacters to accept desiredCharacterCount as an argument
async function fetchCharacters(desiredCharacterCount) {
    let currentPage = 1;
    let totalCharactersFetched = 0;
    document.getElementById('status').textContent = "Fetching characters...";
    while (true) { // Keep fetching until we break explicitly
        const queryFavorites = `
    query {
        Page(perPage: ${charactersPerPage}, page: ${currentPage}) {
        characters(sort: FAVOURITES_DESC) {
            name {
            full,
            first
            }
            id
            image {
            large
            }
            gender
            age
            siteUrl
            media(perPage: 1, sort: POPULARITY_DESC) {
              nodes {
                title {
                  english
                  romaji
                }
                coverImage {
                  extraLarge
                }
                bannerImage
              }
            }
            
        }
        }
    }
    `;
        const queryTrending = `
    query{
      Page(perPage: ${charactersPerPage}, page: ${currentPage}) {
        media(sort: TRENDING_DESC, format_in: [MOVIE, ONA, ONE_SHOT, OVA, SPECIAL, TV, TV_SHORT], status_not: NOT_YET_RELEASED) {
          title {
            english
            romaji
          }
          coverImage {
            extraLarge
          }
          bannerImage
          characters(role: MAIN) {
            nodes {
              name {
                full
                first
              }
              id
              image {
                large
              }
              gender
              age
              siteUrl
            }
          }
        }
      }
    }
    `;

        try {
            const response = await fetch('https://graphql.anilist.co/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query: desiredSearchType === "Favorites" ? queryFavorites : queryTrending }),
            });

            console.log(`Desired gender: ${(desiredGender === "Both" ? ["Female" || "Male"] : desiredGender)}`);

            result = await response.json();
            let newCharactersRaw = [];
            let newCharacters = [];

            if (desiredSearchType === "Favorites") {
                newCharactersRaw = result.data.Page.characters;
            } else {
                let temp = result.data.Page.media.map(element => element.characters);
                allMedia.push(...result.data.Page.media);

                temp.forEach(char => {
                    newCharactersRaw.push(...char.nodes);
                });
            }

            console.log(newCharactersRaw)

            if (desiredGender === "Both") {
                newCharacters = newCharactersRaw.filter(character => ((parseInt(character.age) >= desiredMinAge && parseInt(character.age) <= desiredMaxAge) || character.age == null) && !(character in characters));
            } else {
                let seenIds = new Set(); // Track IDs we've already processed

                newCharactersRaw.forEach(character => {
                    // Skip if we've already seen this ID in the current batch
                    if (seenIds.has(character.id)) {
                        return;
                    }

                    let age = character.age ? parseInt(character.age) : null;

                    // Check all conditions
                    if (character.gender === desiredGender &&
                        (age === null || (age >= desiredMinAge && age <= desiredMaxAge)) &&
                        !characters.some(c => c.id === character.id)) {

                        newCharacters.push(character);
                        seenIds.add(character.id); // Mark this ID as processed
                    }
                });
            }

            characters = characters.concat(newCharacters);
            console.log(characters)
            totalCharactersFetched += newCharacters.length;
            currentPage++;

            console.debug("Total fetched: " + totalCharactersFetched)
            document.getElementById('status').textContent = "Total characters fetched: " + totalCharactersFetched;

            if (newCharacters.length === 0) {
                emptyPages++;
            } else {
                emptyPages = 0;
            }

            // Break if we've reached the desired number of characters or there are no more characters
            if (totalCharactersFetched >= desiredCharacterCount || emptyPages > 10) {
                console.debug("BREAK")
                characters.forEach(element => {
                    if (element.name.full.trim() === "Mikasa Ackerman") {
                        console.log("1")
                    }
                });
                emptyPages = 0;
                break;
            }

        } catch (error) {
            console.error('Error fetching characters:', error);
            currentPage--;
            document.getElementById('status').textContent = "API limit reached. Please wait 1 minute for access.";
            countdown(60, "status");
            await pause(60000);
        }
    }
    console.debug("Desired: " + desiredCharacterCount)

    // document.body.style.overflow = 'auto';

    if (characters.length > desiredCharacterCount) {
        characters = characters.slice(0, desiredCharacterCount)
    }
    console.debug([...characters]);

    if (characters.length % 2 != 0) {
        characters.pop();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    shuffleArray(characters);


    survivors = [...characters];
    updateStatus();
    gameEnded = false;
    inputBlocked = false;
    startDuel();
    setTimeout(() => {
        scrollToElement("duel-container");
    }, 100);
}


function updateStatus() {
    const statusElement = document.getElementById('status');
    statusElement.innerHTML = `<h2>Round: ${round}</h2><p>Survivors Remaining: ${survivors.length}</p>`;
}

let duelsPerRound = 0; // Track the number of duels in the current round

function startDuel() {
    document.getElementById("loader").style.display = "none";
    console.debug(survivors.length);

    if (survivors.length <= 1) {
        showFinalBoard();
        gameEnded = true; // Block input after the game ends
        return;
    }



    const duelContainer = document.getElementById('duel-container');
    duelContainer.innerHTML = '';

    if (duelsPerRound === 0) {
        duelsPerRound = survivors.length / 2;
        round++;
    }
    duelsPerRound--;


    updateStatus();

    const char1 = survivors.shift();
    const char2 = survivors.shift();

    currentDuel = [char1, char2];

    displayCharacter(char1, duelContainer);

    const vsText = document.createElement('p');
    vsText.textContent = "VS";
    vsText.style.color = 'white';
    vsText.style.fontFamily = "KitchoScript-Slim";
    vsText.style.margin = '0';
    vsText.style.marginLeft = '50px';
    vsText.style.marginRight = '50px';
    vsText.style.alignSelf = 'center';
    duelContainer.appendChild(vsText);

    displayCharacter(char2, duelContainer);
}
let inputBlocked = false; // New flag to block input during animation
let gameEnded = false; // Flag to prevent input after the game ends

function addDownloadButton(element) {
    // Position the element absolutely and ensure it's on top
    element.style.position = 'fixed';
    element.style.zIndex = '9999';

    // Apply positioning or default to top-right
    const position = { bottom: '10px', right: '10px' };
    Object.assign(element.style, position);

    // Add to document body
    document.body.appendChild(element);
}

function displayCharacter(character, container) {
    const charDiv = document.createElement('div');
    charDiv.classList.add('character-card');

    const charImg = document.createElement('img');
    charImg.src = character.image.large;
    charImg.alt = character.name.full;

    // Add click event listener to the image
    charDiv.addEventListener('click', () => {

        if (isAltPressed) {
            openUrlInNewTab(character.siteUrl);
            isAltPressed = false;
        } else {
            // Find the opponent in the current duel
            const opponent = currentDuel.find(char => char !== character);

            // Call selectWinner with the clicked character as the winner
            selectWinner(character, opponent);
        }

    });

    charDiv.appendChild(charImg);
    infoContainer = document.createElement('div');
    charDiv.appendChild(infoContainer);
    const charName = document.createElement('p');
    charName.id = 'charName';
    charName.textContent = character.name.full;
    infoContainer.appendChild(charName);

    const charMedia = document.createElement('p');
    charMedia.id = 'charMedia';

    let media;
    if (desiredSearchType === "Favorites") {
        media = character.media.nodes[0];
    } else {
        //media = character.media.edges[0].node;
        media = allMedia.find(item => {
            return item.characters.nodes.some(char => char.id === character.id);
        });
    }

    if (media.title.english !== null) {
        charMedia.textContent = media.title.english;
    } else {
        charMedia.textContent = media.title.romaji;
    }
    infoContainer.appendChild(charMedia);


    charDiv.style.backgroundImage = `linear-gradient(rgba(100, 100, 100, 0.6), rgba(0, 0, 0, 1)), url(${media.coverImage.extraLarge})`;


    container.appendChild(charDiv);
}

function selectWinner(winner, loser) {
    if (inputBlocked || gameEnded) return; // If input is blocked or game ended, do nothing

    inputBlocked = true; // Block input during the animation
    survivors.push(winner);
    eliminated.push(loser);

    console.log(`Age of winner: ${parseInt(winner.age)}`);

    const winnerCard = document.querySelector(`.character-card img[src="${winner.image.large}"]`).parentElement;
    winnerCard.classList.add('highlight');

    const loserCard = document.querySelector(`.character-card img[src="${loser.image.large}"]`).parentElement;
    loserCard.classList.add('loser');


    setTimeout(() => {
        winnerCard.classList.remove('highlight');

        // Delay starting the next duel to allow the animation to finish
        setTimeout(() => {
            if (survivors.length === 2) {
                round++;
            }
            inputBlocked = false; // Unblock input after the animation ends
            startDuel(); // Start next duel
        }, 200); // Adjust the delay (in milliseconds) as needed
    }, 200);
}
// Handle key press for left and right arrows
document.addEventListener('keydown', function (event) {
    if (inputBlocked || gameEnded) return; // Block input if input is blocked or game is over

    if (event.key === 'ArrowLeft') {
        selectWinner(currentDuel[0], currentDuel[1]);
    } else if (event.key === 'ArrowRight') {
        selectWinner(currentDuel[1], currentDuel[0]);
    }
});

function saveFinalBoard() {
    saveElementAsMultipleJPGs('final-board');
}

function showFinalBoard() {
    document.getElementById('status').textContent = "";
    // Create your element
    const downloadButton = document.createElement('div');
    downloadButton.innerHTML = '<button onclick="saveFinalBoard()" class="Btn"><svg class="svgIcon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg><span class="icon2"></span><span class="tooltip">Download</span></button>';
    // Add it to the bottom-left corner
    addDownloadButton(downloadButton);

    updateStatus();

    let media;
    if (desiredSearchType === "Favorites") {
        media = survivors[0].media.nodes[0];
    } else {
        media = allMedia.find(item => {
            return item.characters.nodes.some(char => char.id === survivors[0].id);
        });
    }

    document.body.style.justifyContent = 'flex-start';
    const finalBoard = document.getElementById('final-board');
    finalBoard.innerHTML = `<div style="text-align: center;" class=element><h2 id="finalWinner">1. Winner: <br>${survivors[0].name.full}</h2>`;
    finalBoard.innerHTML += `<div id="finalBanner" style="width: 100%; background-image: url(${media.bannerImage})">
                              <img id="winner-img" class="finalWinner" onclick="openUrlInNewTab('${survivors[0].siteUrl}')" src="${survivors[0].image.large}" alt="${survivors[0].name.full}">
                            </div>`

    getMeta(media.bannerImage, (err, img) => {
        let ratio = img.naturalWidth / img.naturalHeight
        let height = 100 / ratio
        document.getElementById("finalBanner").style.height = height + "vw";
    });


    let board = '<div id="board" class="element"><h3>Elimination Rankings</h3><div id="elimBoard">'; // Use <ol> for numbered list
    let rank = 2; // Initialize rank counter

    eliminated.reverse();
    console.debug(eliminated);

    eliminated.forEach(char => {
        board += `<div class="elimDiv" onclick="openUrlInNewTab('${char.siteUrl}')">
                  <img class="topElimImg" src=${char.image.large} alt="">
                  <div id='charName'>&#11165 ${rank}. ${char.name.first}</div>
                </div>`;
        rank++;
    });

    board += "</div></div>"; // Close the div
    finalBoard.innerHTML += board;

    gameEnded = true; // Block input after the final board is displayed
    setTimeout(() => {
        scrollToElement("winner-img");
    }, 100);
}