const gridContainer = document.querySelector(".grid-container");
const scoreDisplay = document.querySelector(".score");
const timerDisplay = document.querySelector(".timer");
const attemptsDisplay = document.querySelector(".attempts-count");
const actionButton = document.querySelector(".actions button");
const nextLevelButton = document.getElementById("nextLevelButton");
const restartButton = document.getElementById("restartButton");

let cards = [];
let firstCard, secondCard;
let lockBoard = false;
let score = 0;
let attempts = 0;
let matches = 0;
const maxTime = 120;
let timeLeft = maxTime;
let timerInterval = null;
let gameStarted = false;
let level = 1;
const levelTimes = {
  1: 120,
  2: 90,
  3: 60,
};
let timeLeftAtLevel = {};

const WIDTH = 500;
const HEIGHT = 500;
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(WIDTH, HEIGHT);
renderer.domElement.style.width = WIDTH + "px";
renderer.domElement.style.height = HEIGHT + "px";
renderer.setPixelRatio(window.devicePixelRatio);

scoreDisplay.textContent = score;

actionButton.textContent = "POČNI IGRU";

let originalCardsData = [];

fetch("./data/cards.json")
  .then((res) => res.json())
  .then((data) => {
    originalCardsData = data;
    cards = [...originalCardsData, ...originalCardsData];
    shuffleCards();
    generateCards();
  });

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function shuffleCards() {
  let currentIndex = cards.length,
    randomIndex,
    temporaryValue;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = cards[currentIndex];
    cards[currentIndex] = cards[randomIndex];
    cards[randomIndex] = temporaryValue;
  }
}

function create3DShapeImage(name) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.z = 3;

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  let geometry,
    color,
    rotation = { x: 0, y: 0, z: 0 };

  switch (name) {
    case "cube":
      geometry = new THREE.BoxGeometry(1, 1, 1);
      color = 0xa94acf;
      rotation = { x: 0.5, y: 0.8, z: 0 };
      break;
    case "sphere":
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      color = 0xff4444;
      break;
    case "cone":
      geometry = new THREE.ConeGeometry(0.5, 1, 32);
      color = 0x6eb840;
      rotation = { x: 0.2, y: 0, z: 0 };
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 32);
      color = 0xf542b6;
      rotation = { x: 0.4, y: 0, z: 0 };
      break;
    case "pyramid":
      geometry = new THREE.ConeGeometry(0.6, 1, 3);
      color = 0x0099cc;
      rotation = { x: 0.1, y: 0, z: 0 };
      break;
    case "cuboid":
      geometry = new THREE.BoxGeometry(1.5, 0.7, 0.7);
      color = 0x149c2c;
      rotation = { x: 0.4, y: 0.75, z: 0 };
      break;
    case "octahedron":
      geometry = new THREE.CylinderGeometry(0.2, 0.6, 1, 3);
      color = 0xbf7aff;
      break;
    case "coneTall":
      geometry = new THREE.CylinderGeometry(0.3, 0.6, 1, 32);
      color = 0x00fbff;
      rotation = { x: 0.4, y: 0.1, z: 0 };
      break;
    case "triangularPrism":
      geometry = createTriangularPrismGeometry();
      color = 0x2e50ff;
      rotation = { x: -0.2, y: 0.5, z: 0 };
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
      color = 0xffffff;
  }

  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.5,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);

  scene.add(mesh);
  renderer.render(scene, camera);

  return renderer.domElement.toDataURL();
}

function createTriangularPrismGeometry() {
  const geometry = new THREE.BufferGeometry();

  const radius = 0.5;
  const height = 1.3;
  const segments = 3;

  const base1 = [];
  const base2 = [];

  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    base1.push([x, 0, z]);
    base2.push([x, height, z]);
  }

  const vertices = [];

  base1.forEach((v) => vertices.push(...v));
  base2.forEach((v) => vertices.push(...v));

  const indices = [];

  indices.push(0, 2, 1);
  indices.push(3, 4, 5);

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(i, next, 3 + next);
    indices.push(i, 3 + next, 3 + i);
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices), 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.center();

  return geometry;
}

function generateCards() {
  gridContainer.innerHTML = "";
  for (let card of cards) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("data-name", card.name);

    cardElement.innerHTML = `
      <div class="front"></div>
      <div class="back"></div>`;

    const front = cardElement.querySelector(".front");

    const img = document.createElement("img");
    img.src = create3DShapeImage(card.name);
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    front.appendChild(img);

    gridContainer.appendChild(cardElement);

    cardElement.addEventListener("click", flipCard);
  }
}

function flipCard() {
  if (!gameStarted) return;
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;

  checkForMatch();
}

const pairDescriptions = {
  cube: "Ovo je kocka. Sastoji se od 6 kvadratnih stranica. Najčešći primeri su kutije i kocke za igranje.",
  sphere:
    "Ovo je lopta. Sastoji se od jedne zakrivljene površine. Najčešći primeri su sportske lopte  i globus.",
  cone: "Ovo je kupa. Sastoji se od kružne baze i vrha. Najčešći primeri su kornet za sladoled i kapa.",
  cylinder:
    "Ovo je valjak. Sastoji se od dve kružne baze spojene pravugaonom bočnom stranom. Najčešći primeri su cevi i limenke.",
  pyramid:
    "Ovo je trostrana piramida. Sastoji se od tri trouglaste strane i baze. Najčešći primeri su kristali.",
  cuboid:
    "Ovo je kvadar. Sastoji se od šest pravougaonih stranica. Najčešći primeri su ormani i kutije.",
  octahedron:
    "Ovo je zarubljena četvorostrana piramida. Sastoji se od osam trouglastih stranica. Primenjuje se u kristalografiji i geometrijskim modelima.",
  coneTall:
    "Ovo je zarubljena kupa. Sastoji se od dve kružne baze spojene trapeznom bočnom stranom. Najčešće se primenjuje za dizajn čaša.",
  triangularPrism:
    "Ovo je trostrana prizma. Sastoji se od dve trougaone baze i tri bočne pravugaone strane. Najčešći primeri su stubovi.",
};
function checkForMatch() {
  attempts++;
  attemptsDisplay.textContent = attempts;

  let isMatch = firstCard.dataset.name === secondCard.dataset.name;

  if (isMatch) {
    matches++;
    score++;
    scoreDisplay.textContent = score;

    clearInterval(timerInterval);
    lockBoard = true;

    const shapeName = firstCard.dataset.name;
    showPairInfoPopup(
      pairDescriptions[shapeName] || "Bravo, pogodili ste par!",
      shapeName
    );

    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);

    if (matches === cards.length / 2) {
      if (level < 3) {
        showLevelCompletePopup(level);
      } else {
        endGame(true);
      }
    }
  } else {
    unflipCards();
  }
}

const pairInfoPopup = document.createElement("div");
pairInfoPopup.id = "pairInfoPopup";

const pairImage = document.createElement("img");
pairImage.id = "pairImage";

const pairDescription = document.createElement("div");
pairDescription.id = "pairDescription";

const continueButton = document.createElement("button");
continueButton.textContent = "Nastavi dalje";
continueButton.classList.add("continue-btn");

pairInfoPopup.appendChild(pairImage);
pairInfoPopup.appendChild(pairDescription);
pairInfoPopup.appendChild(continueButton);
document.body.appendChild(pairInfoPopup);

continueButton.addEventListener("click", () => {
  pairInfoPopup.style.display = "none";

  if (matches === cards.length / 2) {
    if (level < 3) {
      showLevelCompletePopup(level);
    } else {
      endGame(true);
    }
  } else {
    startTimer();
    lockBoard = false;
    resetBoard();
    gameStarted = true;
  }
});

function showPairInfoPopup(text, shapeName) {
  pairDescription.textContent = text;
  pairImage.src = create3DShapeImage(shapeName);
  pairImage.alt = shapeName;
  pairInfoPopup.style.display = "block";
}

function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);
  resetBoard();
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetBoard();
  }, 1000);
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function startTimer() {
  clearInterval(timerInterval);
  timerDisplay.textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame(false);
    }
  }, 1000);
}

function endGame(won) {
  gameStarted = false;
  clearInterval(timerInterval);

  const blurOverlay = document.getElementById("blurOverlay");
  const popup = document.getElementById("popupMessage");
  const text = document.getElementById("messageText");
  const image = document.getElementById("popupImage");

  blurOverlay.style.display = "block";
  popup.style.display = "block";

  if (won) {
    let totalTime = 0;
    for (let i = 1; i <= 3; i++) {
      totalTime += levelTimes[i] - (timeLeftAtLevel[i] || 0);
    }
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    text.innerHTML = `
      <h2>BRAVO!</h2>
      <div class="details">
        Uspešno si završio/la igru! <br>
        Trebalo ti je ukupno ${minutes} minuta i ${seconds} sekundi da pređeš sva tri nivoa!<br>
      </div> `;
    image.src = "assets/party.png";
    image.alt = "Party!";
    image.style.display = "block";
  } else {
    text.innerHTML = `
      <h2>Vreme je isteklo!</h2>
      <div class="details">Pokušaj ponovo!</div>`;
    image.src = "assets/alarm.png";
    image.alt = "Alarm!";
    image.style.display = "block";
    level = 1;
  }

  nextLevelButton.style.display = "none";
  restartButton.style.display = "inline-block";
  restartButton.onclick = () => restart(false);
}

function restart(isNextLevel = false) {
  lockBoard = false;
  firstCard = null;
  secondCard = null;
  document.getElementById("blurOverlay").style.display = "none";
  document.getElementById("popupMessage").style.display = "none";

  if (!isNextLevel) {
    level = 1;
  }

  timeLeft = levelTimes[level];

  clearInterval(timerInterval);
  gameStarted = true;
  score = 0;
  attempts = 0;
  matches = 0;

  scoreDisplay.textContent = score;
  attemptsDisplay.textContent = attempts;
  timerDisplay.textContent = formatTime(timeLeft);
  document.querySelector(".level-number").textContent = level;

  cards = [...originalCardsData, ...originalCardsData];
  shuffleCards();
  generateCards();

  startTimer();
  actionButton.textContent = "IGRAJ PONOVO";
  actionButton.onclick = () => restart(false);
  gameStarted = true;
}

function startGame() {
  gameStarted = true;
  score = 0;
  attempts = 0;
  matches = 0;
  scoreDisplay.textContent = score;
  attemptsDisplay.textContent = attempts;
  timeLeft = levelTimes[level];
  document.querySelector(".level-number").textContent = level;
  timerDisplay.textContent = formatTime(timeLeft);
  gridContainer.innerHTML = "";
  shuffleCards();
  generateCards();
  startTimer();
  actionButton.textContent = "PLAY AGAIN";
  actionButton.onclick = () => restart(false);
}

function resetGame() {
  clearInterval(timerInterval);
  gameStarted = false;
  gridContainer.innerHTML = "";
  score = 0;
  attempts = 0;
  matches = 0;
  scoreDisplay.textContent = score;
  attemptsDisplay.textContent = attempts;
  timerDisplay.textContent = formatTime(levelTimes[level]);
  actionButton.textContent = "START";
}
function closePopup() {
  document.getElementById("popupMessage").style.display = "none";
  document.getElementById("blurOverlay").style.display = "none";
}

function showLevelCompletePopup(currentLevel) {
  const blurOverlay = document.getElementById("blurOverlay");
  const popup = document.getElementById("popupMessage");
  const text = document.getElementById("messageText");
  const image = document.getElementById("popupImage");
  const nextLevelButton = document.getElementById("nextLevelButton");
  const restartButton = document.getElementById("restartButton");

  blurOverlay.style.display = "block";
  popup.style.display = "block";

  text.innerHTML = `<h2>Nivo ${currentLevel} završen!</h2>
    <div class="details">
      Bravo! Spreman/spremna za sledeći nivo?
    </div>`;
  image.src = "assets/next.png";
  image.alt = "Next!";
  image.style.display = "block";
  timeLeftAtLevel[currentLevel] = timeLeft;

  nextLevelButton.style.display = "inline-block";
  restartButton.style.display = "none";

  nextLevelButton.onclick = () => {
    nextLevelButton.style.display = "none";
    blurOverlay.style.display = "none";
    popup.style.display = "none";

    level++;
    restart(true);
  };
}
