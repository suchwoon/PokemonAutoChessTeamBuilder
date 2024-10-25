let pokemonData = [];       // Stores the parsed Pokémon data
let pokemonToTypes = {};    // Maps Pokémon to their types
let pokemonRarities = {};   // Maps Pokémon to their rarity
let PkmIndex = {};          // Maps Pokémon names to their index numbers
let deck = [];              // Stores the Pokémon added to the deck
let allTypesSet = new Set(); // Stores all unique types

// Fetch and parse the CSV data
fetch('pokemons-data.csv')
    .then(response => response.text())
    .then(csvData => {
        pokemonData = parseCSV(csvData);
        processPokemonData();
        createTypeFilter(); // Generate the type filter dynamically with images
        displayPokemonPool();
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to parse CSV data
function parseCSV(data) {
    const lines = data.trim().split('\n');
    const result = [];
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(',');

        // Skip empty lines
        if (currentline.length === 1 && currentline[0] === '') continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j].trim();
            const value = currentline[j] ? currentline[j].trim() : '';
            obj[header] = value;
        }
        result.push(obj);
    }
    return result;
}

// Process the parsed Pokémon data to create necessary mappings
function processPokemonData() {
    pokemonData.forEach(pokemon => {
        const name = pokemon['Name'].toUpperCase();
        const index = pokemon['Index'];
        const rarity = pokemon['Category'].toLowerCase();

        // Map name to index
        PkmIndex[name] = index;

        // Map name to rarity
        pokemonRarities[name] = rarity;

        // Map name to types
        const types = [];
        for (let i = 1; i <= 4; i++) {
            const type = pokemon[`Type ${i}`];
            if (type) {
                types.push(type.toUpperCase());
                allTypesSet.add(type.toUpperCase());
            }
        }
        pokemonToTypes[name] = types;
    });
}

// Create the type filter dynamically based on the types in pokemonData, using images
function createTypeFilter() {
    const typeFilterDiv = document.getElementById('type-filter');
    typeFilterDiv.innerHTML = ''; // Removed the heading

    // Add the 'All' option with a default icon or text
    const allLabel = document.createElement('label');
    allLabel.classList.add('type-option');
    allLabel.innerHTML = `
        <input type="radio" name="type" value="all" checked onchange="filterPokemon()">
        <span class="type-all">All</span>
    `;
    typeFilterDiv.appendChild(allLabel);

    // Get the types and sort them alphabetically for better UX
    const types = Array.from(allTypesSet).sort();

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

// Function to get the image path for a Pokémon
function getPokemonImagePath(pokemon) {
    const indexNumber = PkmIndex[pokemon];
    if (!indexNumber) {
        console.warn(`Index number not found for Pokémon: ${pokemon}`);
        return null; // Return null if index number is not found
    }

    const indexPath = indexNumber;

    // Build the image path
    let imgPath = '';
    if (indexNumber.includes('-')) {
        const parts = indexNumber.split('-');
        imgPath = `portrait/${parts[0]}/${parts[1]}/Normal.png`;
    } else {
        imgPath = `portrait/${indexPath}/Normal.png`;
    }
    return imgPath;
}

// Display all Pokémon in the pool
function displayPokemonPool() {
    const pool = document.getElementById('pokemon-pool');
    pool.innerHTML = ''; // Clear the pool

    pokemonData.forEach(pokemon => {
        const name = pokemon['Name'].toUpperCase();
        const imgPath = getPokemonImagePath(name);
        if (!imgPath) return; // Skip if image path is not found

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('pokemon-container', 'pool-pokemon-container'); // Add specific class

        const img = document.createElement('img');
        img.src = imgPath;
        img.alt = name;
        img.title = name;
        img.classList.add('pokemon');
        img.draggable = true;
        img.id = name;
        img.addEventListener('dragstart', drag);

        // Add single-click event to display Pokémon info
        img.addEventListener('click', () => displayPokemonInfo(name));

        // Add double-click event to add Pokémon to the team
        img.addEventListener('dblclick', () => addToTeam(name));

        // Get the rarity of the Pokémon
        const rarity = pokemonRarities[name] ? pokemonRarities[name].toLowerCase() : 'unknown';

        // Create a label or badge for the rarity
        const rarityLabel = document.createElement('span');
        rarityLabel.classList.add('rarity-label', rarity);
        rarityLabel.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);

        // Append the image and rarity label to the container
        imgContainer.appendChild(img);
        imgContainer.appendChild(rarityLabel);

        pool.appendChild(imgContainer);
    });

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
    clone.addEventListener('click', () => displayPokemonInfo(pokemonId)); // Add click event to display info
    clone.style.cursor = 'pointer';

    // Get the rarity
    const rarity = pokemonRarities[pokemonId] ? pokemonRarities[pokemonId].toLowerCase() : 'unknown';
    const rarityLabel = document.createElement('span');
    rarityLabel.classList.add('rarity-label', rarity);
    rarityLabel.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);

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
        // Clear the Pokémon Info box if the removed Pokémon was selected
        const selectedPokemonId = document.getElementById('pokemon-info').dataset.selectedPokemon;
        if (selectedPokemonId === pokemonId) {
            clearPokemonInfo();
        }
    }
}

// Update synergies based on the current deck
function updateSynergies() {
    const synergyDisplay = document.getElementById('synergy-display');
    synergyDisplay.innerHTML = ''; // Removed the 'Synergies' text
    const synergyCount = {};

    // Iterate over the deck to count types
    deck.forEach(pokemon => {
        // Count types
        pokemonToTypes[pokemon].forEach(type => {
            synergyCount[type] = (synergyCount[type] || 0) + 1;
        });
    });

    // Convert synergyCount object into an array of [type, count] pairs
    const synergyArray = Object.entries(synergyCount);

    // Sort the array by count in descending order
    synergyArray.sort((a, b) => b[1] - a[1]);

    // Display the type synergies with icons
    const synergyContainer = document.createElement('div');
    synergyContainer.classList.add('synergy-icons');

    synergyArray.forEach(([type, count]) => {
        const synergyItem = document.createElement('div');
        synergyItem.classList.add('synergy-item');

        // Create the type icon
        const typeIcon = document.createElement('img');
        typeIcon.src = `types/${type.toUpperCase()}.svg`;
        typeIcon.alt = type;
        typeIcon.title = `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} (${count})`;
        typeIcon.classList.add('synergy-icon');

        // Create the count label
        const countLabel = document.createElement('span');
        countLabel.textContent = count;
        countLabel.classList.add('synergy-count');

        synergyItem.appendChild(typeIcon);
        synergyItem.appendChild(countLabel);
        synergyContainer.appendChild(synergyItem);
    });

    synergyDisplay.appendChild(synergyContainer);
}

// Display Pokémon info when a Pokémon is clicked
function displayPokemonInfo(pokemonId) {
    const infoBox = document.getElementById('pokemon-info');
    infoBox.innerHTML = ''; // Clear previous info
    infoBox.dataset.selectedPokemon = pokemonId; // Store selected Pokémon ID

    // Get the Pokémon's types
    const types = pokemonToTypes[pokemonId];

    // Create a container for the Pokémon image
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('info-image-container');

    // Get the image path
    const imgPath = getPokemonImagePath(pokemonId);

    const pokemonImage = document.createElement('img');
    pokemonImage.src = imgPath;
    pokemonImage.alt = pokemonId;
    pokemonImage.title = pokemonId;
    pokemonImage.classList.add('info-pokemon-image');

    imageContainer.appendChild(pokemonImage);

    // Create a container for the type icons
    const typeContainer = document.createElement('div');
    typeContainer.classList.add('info-type-icons');

    types.forEach(type => {
        const typeIcon = document.createElement('img');
        typeIcon.src = `types/${type.toUpperCase()}.svg`;
        typeIcon.alt = type;
        typeIcon.title = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        typeIcon.classList.add('info-type-icon');

        typeContainer.appendChild(typeIcon);
    });

    // Append the Pokémon image and type icons to the info box
    infoBox.appendChild(imageContainer);
    infoBox.appendChild(typeContainer);
}

// Clear the Pokémon Info box
function clearPokemonInfo() {
    const infoBox = document.getElementById('pokemon-info');
    infoBox.innerHTML = '';
    delete infoBox.dataset.selectedPokemon;
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

    // Select only the Pokémon containers in the pool
    const pokemonContainers = document.getElementsByClassName('pool-pokemon-container');

    Array.from(pokemonContainers).forEach(container => {
        const pokemon = container.querySelector('.pokemon');
        const name = pokemon.id.toLowerCase();
        const rarity = pokemonRarities[pokemon.id] ? pokemonRarities[pokemon.id].toLowerCase() : 'unknown';
        const types = pokemonToTypes[pokemon.id].map(type => type.toLowerCase());

        // Check if Pokémon matches search input, selected rarity, and selected type
        const matchesName = name.includes(input);
        const matchesRarity = selectedRarity === 'all' || rarity === selectedRarity;
        const matchesType = selectedType === 'all' || types.includes(selectedType);

        if (matchesName && matchesRarity && matchesType) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}