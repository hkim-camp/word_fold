const boards = [
    {
        cells: [
            ["E", "L", "W", "Y", "C"],
            ["Y", "L", "O", "A", "N"],
            ["U", "B", "L", "E", "E"],
            ["E", "L", "P", "M", "V"],
            ["P", "U", "R", "A", "U"]],
        words: ["CYAN", "YELLOW", "PURPLE", "MAUVE", "BLUE"]
    },
    {
        cells: [
            ["E", "K", "O", "A", "P"],
            ["A", "W", "L", "I", "R"],
            ["N", "S", "F", "A", "T"],
            ["L", "E", "E", "R", "A"],
            ["A", "G", "G", "U", "J"]],
        words: ["TAPIR", "EAGLE", "JAGUAR", "SNAKE", "WOLF"]
    },
    {
        cells: [
            ["H", "C", "N", "A", "N"],
            ["Y", "R", "A", "A", "A"],
            ["R", "E", "A", "Y", "B"],
            ["F", "P", "P", "E", "R"],
            ["I", "G", "A", "P", "A"]],
        words: ["CHERRY", "PAPAYA", "BANANA", "PEAR", "FIG"]
    },
]

// Prevent text selection on double-click for game cells.
const style = document.createElement('style');
style.innerHTML = `
  #cell-holder > div {
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE 10+ */
    user-select: none; /* Standard syntax */
  }
`;
document.head.appendChild(style);

function make_cell_list() {
    let cells = [...document.getElementById("cell-holder").children];
    let cell_board = [];
    for (let i = 0; i < 25; i += 5) {
        cell_board.push(cells.slice(i, i + 5))
    }
    return cell_board;
}

function setup_game(starting_cells) {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            CELLS[y][x].innerHTML = starting_cells[y][x];
            CELLS[y][x].classList.remove('completed', 'selected');
            CELLS[y][x].style.color = '';
            CELLS[y][x].style.cursor = ''; // Reset cursor to default from CSS
        }
    }
}

/**
 * Displays the list of words to find, creating individual elements for each word
 * to allow for individual styling.
 */
function display_words() {
    const wordsContainer = document.getElementById('words');
    wordsContainer.innerHTML = ''; // Clear previous content

    currentBoard.words.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.textContent = word;
        wordDiv.id = `word-${word}`;
        wordDiv.className = 'word-item';
        wordsContainer.appendChild(wordDiv);
    });
}

/**
 * Adds control buttons like 'Reset Board' to the UI.
 */
function create_control_buttons() {
    const wordsContainer = document.getElementById("words");
    // Find a good place to insert the buttons, e.g., after the words list.
    const parent = wordsContainer.parentElement;
    if (!parent) return;

    // Avoid creating buttons multiple times
    if (document.getElementById('game-controls')) return;

    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'game-controls';
    controlsDiv.style.marginTop = '5%';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.flexDirection = 'row';
    controlsDiv.style.alignItems = 'center';
    controlsDiv.style.justifyContent = 'center';

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Board';
    resetButton.onclick = reset_board;
    Object.assign(resetButton.style, {
        fontSize: '1em', cursor: 'pointer'
    });

    controlsDiv.appendChild(resetButton);

    // Insert after the words container
    parent.insertBefore(controlsDiv, wordsContainer.nextSibling);
}

const CELLS = make_cell_list();
let selected_x = -1;
let selected_y = -1;

let randomBoardIndex = Math.floor(Math.random() * boards.length);
let currentBoard = boards[randomBoardIndex];
setup_game(currentBoard.cells);
display_words();
create_control_buttons();

function move(x, y) {
    CELLS[y][x].innerHTML = CELLS[selected_y][selected_x].innerHTML + CELLS[y][x].innerHTML;
    CELLS[selected_y][selected_x].innerHTML = ""
    select(x, y);
    update_word_colors();
    const hasWon = check_win();
    if (!hasWon) {
        check_lose();
    }
}

/**
 * Checks for completed words on the board and updates their color in the word list.
 */
function update_word_colors() {
    const wordsOnBoard = new Map(); // Map from cell content to the cell element
    CELLS.flat().forEach(cell => {
        // Clear old 'completed' state from all cells first.
        // This handles cases where a completed word is broken up.
        cell.classList.remove('completed');
        cell.style.color = ''; // Reset text color
        if (cell.innerHTML) {
            wordsOnBoard.set(cell.innerHTML, cell);
        }
    });

    currentBoard.words.forEach(targetWord => {
        const wordElement = document.getElementById(`word-${targetWord}`);
        if (!wordElement) return;

        if (wordsOnBoard.has(targetWord)) {
            // Word is completed on the board
            wordElement.classList.add('completed');
            const cellElement = wordsOnBoard.get(targetWord);
            cellElement.classList.add('completed');
            cellElement.style.color = 'blue';
            cellElement.style.cursor = 'not-allowed';

            // If the newly completed cell was the selected one, unselect it
            // to prevent it from being moved.
            if (cellElement.classList.contains('selected')) {
                cellElement.classList.remove('selected');
                selected_x = -1;
                selected_y = -1;
            }
        } else {
            // Word is not completed
            wordElement.classList.remove('completed');
        }
    });
}

function unselect(x, y) {
    CELLS[y][x].classList.remove("selected");
    selected_x = -1;
    selected_y = -1;
}

function select(x, y) {
    if (CELLS[y][x].innerHTML.length > 0 && !CELLS[y][x].classList.contains('completed')) {
        if (selected_x >= 0 && selected_y >= 0)
            CELLS[selected_y][selected_x].classList.remove("selected");
        CELLS[y][x].classList.add("selected");
        selected_y = y;
        selected_x = x;
    }
}

function is_close(a, b) {
    return Math.abs(a - b) <= 1
}

function can_move(x, y) {
    let can_move = is_close(selected_x, x) && selected_y == y || is_close(selected_y, y) && selected_x == x;

    return selected_x >= 0 && selected_y >= 0 && can_move && CELLS[y][x].innerHTML.length > 0 && !CELLS[y][x].classList.contains('completed');
}

function on_click(x, y) {
    if (selected_x == x && selected_y == y) {
        unselect(x, y)
    }
    else if (can_move(x, y)) {
        move(x, y)
    } else {
        select(x, y)
    }
}

/**
 * Checks if there are any valid moves left on the board.
 * A move is possible if there are two adjacent, non-completed, non-empty cells.
 * @returns {boolean} True if a move is possible, false otherwise.
 */
function are_any_moves_possible() {
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const cell = CELLS[y][x];
            // We only care about active cells that can potentially be moved.
            if (cell.innerHTML && !cell.classList.contains('completed')) {
                // Check right neighbor (to avoid double-checking pairs)
                if (x < 4 && CELLS[y][x + 1].innerHTML && !CELLS[y][x + 1].classList.contains('completed')) {
                    return true;
                }
                // Check bottom neighbor (to avoid double-checking pairs)
                if (y < 4 && CELLS[y + 1][x].innerHTML && !CELLS[y + 1][x].classList.contains('completed')) {
                    return true;
                }
            }
        }
    }
    return false; // No adjacent active cells found
}

/**
 * Checks if the game has been won.
 * A win occurs when all letters have been combined to form the target words.
 */
function check_win() {
    const wordsOnBoard = [];
    CELLS.forEach(row => {
        row.forEach(cell => {
            if (cell.innerHTML) {
                wordsOnBoard.push(cell.innerHTML);
            }
        });
    });

    const targetWords = currentBoard.words;

    // Quick check: if the number of words on board doesn't match the target, it's not a win.
    if (wordsOnBoard.length !== targetWords.length) {
        return false;
    }

    // Sort both arrays to compare them regardless of the order they were formed in.
    const sortedWordsOnBoard = [...wordsOnBoard].sort();
    const sortedTargetWords = [...targetWords].sort();

    const isWin = sortedWordsOnBoard.every((word, index) => word === sortedTargetWords[index]);

    if (isWin) {
        show_end_screen("You Win!");
        return true;
    }
    return false;
}

/**
 * Checks if the game is in a lost state (no more possible moves) and shows the lose screen.
 */
function check_lose() {
    if (!are_any_moves_possible()) {
        show_end_screen("No more moves! You Lose.");
    }
}

/**
 * Displays an end-game message inside the words container.
 * @param {string} message The message to display (e.g., "You Win!").
 */
function show_end_screen(message) {
    const wordsContainer = document.getElementById('words');
    if (!wordsContainer) return;

    // Prevent multiple end screens by checking if the message is already there
    if (document.querySelector('.end-game-message')) return;

    // Hide the "Words to Spell" heading if it exists
    const heading = wordsContainer.previousElementSibling;
    if (heading) {
        heading.style.display = 'none';
    }

    // Hide the regular game controls
    const controlsContainer = document.getElementById('game-controls');
    if (controlsContainer) {
        controlsContainer.style.display = 'none';
    }

    // Clear the word list and prepare for the end-game message
    wordsContainer.innerHTML = '';
    wordsContainer.style.flexDirection = 'column';
    wordsContainer.style.justifyContent = 'center'; // Center the content vertically

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.className = 'end-game-message'; // Add a class for potential styling
    Object.assign(messageEl.style, {
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center'
    });

    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.onclick = play_again;

    wordsContainer.appendChild(messageEl);
    wordsContainer.appendChild(playAgainButton);
}

/**
 * Resets the current game board to its starting state.
 */
function reset_board() {
    // The end screen is no longer a separate element, so no removal is needed here.
    // If the game had ended, the 'Reset' button would be hidden anyway.

    // Reset the board UI using the current board's initial state
    setup_game(currentBoard.cells);
    display_words();

    // Unselect any cell that might have been selected
    if (selected_x !== -1 && selected_y !== -1) {
        unselect(selected_x, selected_y);
    }
}

/**
 * Resets the game with a new, different random board without reloading the page.
 */
function play_again() {
    // Show the regular game controls again
    const controlsContainer = document.getElementById('game-controls');
    if (controlsContainer) {
        controlsContainer.style.display = 'flex';
    }

    // Restore the flex direction for the words container
    const wordsContainer = document.getElementById('words');
    if (wordsContainer) {
        // Show the "Words to Spell" heading again
        const heading = wordsContainer.previousElementSibling;
        if (heading) {
            heading.style.display = ''; // Reset to default display
        }

        // Reset styles that might have been changed by the end screen
        wordsContainer.style.flexDirection = 'row';
        wordsContainer.style.justifyContent = 'center';
    }

    // Pick a new board index, ensuring it's different from the current one.
    let newBoardIndex;
    if (boards.length > 1) {
        do {
            newBoardIndex = Math.floor(Math.random() * boards.length);
        } while (newBoardIndex === randomBoardIndex);
    } else {
        newBoardIndex = 0; // Only one board, so just use it.
    }

    // Update global game state variables
    randomBoardIndex = newBoardIndex;
    currentBoard = boards[randomBoardIndex];

    // Reset the board UI. display_words() will clear the end-game message.
    setup_game(currentBoard.cells);
    display_words();

    // Unselect any cell that might have been selected
    if (selected_x !== -1 && selected_y !== -1) {
        unselect(selected_x, selected_y);
    }
}