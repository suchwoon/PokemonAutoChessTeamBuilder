let pokemonTypes = {};      // Stores the type-pokemons-all data
let pokemonToTypes = {};    // Maps Pokémon to their types
let pokemonRarities = {};   // Maps Pokémon to their rarity
let deck = [];              // Stores the Pokémon added to the deck

// Fetch the data
Promise.all([
    fetch('type-pokemons-all.json').then(response => response.json()),
    fetch('type-rarity-all.json').then(response => response.json())
])
.then(([typesData, rarityData]) => {
    pokemonTypes = typesData;
    createPokemonTypeMapping();
    createPokemonRarityMapping(rarityData);
    createTypeFilter(); // Generate the type filter dynamically with images
    displayPokemonPool();
})
.catch(error => console.error('Error fetching data:', error));

// Create a mapping from Pokémon to their types
function createPokemonTypeMapping() {
    for (let type in pokemonTypes) {
        pokemonTypes[type].forEach(pokemon => {
            if (!pokemonToTypes[pokemon]) {
                pokemonToTypes[pokemon] = [];
            }
            pokemonToTypes[pokemon].push(type);
        });
    }
}

// Create a mapping from Pokémon to their rarity
function createPokemonRarityMapping(rarityData) {
    for (let rarity in rarityData) {
        rarityData[rarity].forEach(pokemon => {
            pokemonRarities[pokemon] = rarity;
        });
    }
}

// Create the type filter dynamically based on the types in pokemonTypes, using images
function createTypeFilter() {
    const typeFilterDiv = document.getElementById('type-filter');
    typeFilterDiv.innerHTML = '<h3>Filter by Type:</h3>';

    // Add the 'All' option with a default icon or text
    const allLabel = document.createElement('label');
    allLabel.classList.add('type-option');
    allLabel.innerHTML = `
        <input type="radio" name="type" value="all" checked onchange="filterPokemon()">
        <span class="type-all">All</span>
    `;
    typeFilterDiv.appendChild(allLabel);

    // Get the types and sort them alphabetically for better UX
    const types = Object.keys(pokemonTypes).sort();

    types.forEach(type => {
        const label = document.createElement('label');
        label.classList.add('type-option');
        label.innerHTML = `
            <input type="radio" name="type" value="${type.toLowerCase()}" onchange="filterPokemon()">
            <img src="types/${type.toUpperCase()}.svg" alt="${type}" title="${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}">
        `;
        typeFilterDiv.appendChild(label);
    });
}

// Display all Pokémon in the pool
function displayPokemonPool() {
    const pool = document.getElementById('pokemon-pool');
    pool.innerHTML = ''; // Clear the pool
    const addedPokemons = new Set();

    for (let pokemon in pokemonToTypes) {
        if (!addedPokemons.has(pokemon)) {
            const indexNumber = PkmIndex[pokemon.toUpperCase()];
            if (!indexNumber) {
                console.warn(`Index number not found for Pokémon: ${pokemon}`);
                continue; // Skip this Pokémon if index number is not found
            }

            // Build the image path
            let imgPath = '';
            if (indexNumber.includes('-')) {
                const parts = indexNumber.split('-');
                imgPath = `portrait/${parts[0]}/${parts[1]}/Normal.png`;
            } else {
                imgPath = `portrait/${indexNumber}/Normal.png`;
            }

            const imgContainer = document.createElement('div');
            imgContainer.classList.add('pokemon-container');

            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = pokemon;
            img.title = pokemon;
            img.classList.add('pokemon');
            img.draggable = true;
            img.id = pokemon;
            img.addEventListener('dragstart', drag);

            // Add double-click event to add Pokémon to the team
            img.addEventListener('dblclick', () => addToTeam(pokemon));

            // Get the rarity of the Pokémon
            const rarity = pokemonRarities[pokemon] || 'UNKNOWN';

            // Create a label or badge for the rarity
            const rarityLabel = document.createElement('span');
            rarityLabel.classList.add('rarity-label', rarity.toLowerCase());
            rarityLabel.textContent = rarity;

            // Append the image and rarity label to the container
            imgContainer.appendChild(img);
            imgContainer.appendChild(rarityLabel);

            pool.appendChild(imgContainer);
            addedPokemons.add(pokemon);
        }
    }

    // Apply filtering after displaying the pool
    filterPokemon();
}

// Allow dropping on the deck area
function allowDrop(event) {
    event.preventDefault();
}

// Handle the drag event
function drag(event) {
    event.dataTransfer.setData('text', event.target.id);
}

// Handle the drop event
function drop(event) {
    event.preventDefault();
    const pokemonId = event.dataTransfer.getData('text');
    addToTeam(pokemonId);
}

// Add Pokémon to the team
function addToTeam(pokemonId) {
    if (deck.includes(pokemonId)) {
        alert(`${pokemonId} is already in your team.`);
        return;
    }

    const pokemonImg = document.getElementById(pokemonId);

    // Clone the image to add to the deck
    const cloneContainer = document.createElement('div');
    cloneContainer.classList.add('pokemon-container');

    const clone = pokemonImg.cloneNode(true);
    clone.removeEventListener('dragstart', drag);
    clone.addEventListener('dblclick', () => removeFromDeck(pokemonId, cloneContainer));
    clone.style.cursor = 'pointer';

    // Get the rarity
    const rarity = pokemonRarities[pokemonId] || 'UNKNOWN';
    const rarityLabel = document.createElement('span');
    rarityLabel.classList.add('rarity-label', rarity.toLowerCase());
    rarityLabel.textContent = rarity;

    cloneContainer.appendChild(clone);
    cloneContainer.appendChild(rarityLabel);

    document.getElementById('deck-area').appendChild(cloneContainer);

    // Add to deck and update synergies
    deck.push(pokemonId);
    updateSynergies();
}

// Remove Pokémon from the deck
function removeFromDeck(pokemonId, containerElement) {
    const index = deck.indexOf(pokemonId);
    if (index > -1) {
        deck.splice(index, 1);
        containerElement.parentNode.removeChild(containerElement);
        updateSynergies();
    }
}

// Update synergies based on the current deck
function updateSynergies() {
    const synergyDisplay = document.getElementById('synergy-display');
    synergyDisplay.innerHTML = '<h2>Synergies</h2>';
    const synergyCount = {};

    // Iterate over the deck to count types
    deck.forEach(pokemon => {
        // Count types
        pokemonToTypes[pokemon].forEach(type => {
            synergyCount[type] = (synergyCount[type] || 0) + 1;
        });
    });

    // Display the type synergies
    for (let type in synergyCount) {
        const p = document.createElement('p');
        p.textContent = `${type}: ${synergyCount[type]}`;
        synergyDisplay.appendChild(p);
    }
}

// Filter Pokémon based on the search input, selected rarity, and selected type
function filterPokemon() {
    const input = document.getElementById('search-input').value.toLowerCase();

    // Get selected rarity
    const rarityRadio = document.querySelector('#rarity-filter input[name="rarity"]:checked');
    const selectedRarity = rarityRadio ? rarityRadio.value : 'all';

    // Get selected type
    const typeRadio = document.querySelector('#type-filter input[name="type"]:checked');
    const selectedType = typeRadio ? typeRadio.value : 'all';

    const pokemonContainers = document.getElementsByClassName('pokemon-container');

    Array.from(pokemonContainers).forEach(container => {
        const pokemon = container.querySelector('.pokemon');
        const name = pokemon.id.toLowerCase();
        const rarity = pokemonRarities[pokemon.id] ? pokemonRarities[pokemon.id].toLowerCase() : 'unknown';
        const types = pokemonToTypes[pokemon.id].map(type => type.toLowerCase());

        // Check if Pokémon matches search input, selected rarity, and selected type
        const matchesName = name.includes(input);
        const matchesRarity = selectedRarity === 'all' || rarity === selectedRarity;
        const matchesType = selectedType === 'all' || types.map(t => t.toLowerCase()).includes(selectedType);

        if (matchesName && matchesRarity && matchesType) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}
