var resoures_loaded = false;
var soundsToBeLoaded = 0;
var soundsLoaded = 0;
var sounds = [];
function newSoundLoaded()
{
	soundsLoaded++;
	updateLoaded();
}

function updateLoadedSoundsInfo()
{
	document.getElementById('soundsLoadedInfo').innerHTML = soundsLoaded + '/' + soundsToBeLoaded + ' sounds loaded';
}


var imagesToBeLoaded = 0;
var imagesLoaded = 0;
var images = [];
function newImageLoaded()
{
	imagesLoaded++;
	updateLoaded();
}

function updateLoadedImagesInfo()
{
	document.getElementById('imagesLoadedInfo').innerHTML = imagesLoaded + '/' + imagesToBeLoaded + ' images loaded';
}

function setLoadableImage(url,initializing)
{
	imagesToBeLoaded++;
	images[url] = new Image();
	images[url].src = url;
	if(initializing)
	{
		updateLoaded();
		images[url].onload = images[url].onabort = images[url].onerror = newImageLoaded;
	}
}

function loadImage(url)
{
	if(images[url])
	{
		return images[url];
	}
	images[url] = new Image();
	images[url].src = url;
	return images[url];
}
function loadResources()
{
	updateLoaded();
	// Images
	
	// Load characters
	var playerCharacters = ['trashmanred','trashmanblue','trashmanyellow','trashmangreen'];
	for(var i in playerCharacters)
	{
		var currentCharacter = playerCharacters[i];
		setLoadableImage("sprites/" + currentCharacter + "/walk_right.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/walk_left.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stand_right.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stand_left.png",1);
		//setLoadableImage("sprites/" + currentCharacter + "/hurt_right.gif",1);
		//setLoadableImage("sprites/" + currentCharacter + "/hurt_left.gif",1);
		setLoadableImage("sprites/" + currentCharacter + "/stand_down.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stand_up.gif",1);
		setLoadableImage("sprites/" + currentCharacter + "/win.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stunned.png",1);
	}
	
	// Load enemies
	var enemyCharacters = ['banana','robdeprop','trashbag'];
	for(var i in enemyCharacters)
	{
		var currentCharacter = enemyCharacters[i];
		setLoadableImage("sprites/" + currentCharacter + "/walk_right.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/walk_left.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stand_right.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stand_left.png",1);
		setLoadableImage("sprites/" + currentCharacter + "/stunned.png",1);
	}
	
	// Load items
	var itemCharacters = ['heart','coin','bowlingball','fish','star','tnt','egg','basketball'];
	for(var i in itemCharacters)
	{
		var currentCharacter = itemCharacters[i];
		setLoadableImage("sprites/" + currentCharacter + "/normal.png",1);
	}
	setLoadableImage("sprites/coin/gain.png",1);
	
	// Load bars
	setLoadableImage("sprites/bar/middle.png",1);
	setLoadableImage("sprites/bar/left.png",1);
	setLoadableImage("sprites/bar/right.png",1);
	setLoadableImage("sprites/bar/hit.png",1);

	// Load trashcan
	setLoadableImage("sprites/trashcan/open.png",1);
	setLoadableImage("sprites/trashcan/closed.png",1);
	setLoadableImage("sprites/trashcan/hit_left.png",1);
	setLoadableImage("sprites/trashcan/hit_right.png",1);
	setLoadableImage("sprites/trashcan/trashcan_stars.png",1);
	//setLoadableImage("sprites/trashcan/open_up.png",1);
	
	// Other images
	
	setLoadableImage('backgrounds/background2.png',1);
	setLoadableImage('sprites/heart/normal.png',1);
	setLoadableImage('sprites/coin/normal.png',1);
	setLoadableImage('images/default_profile_picture.png',1);
	setLoadableImage('backgrounds/lobby.png',1);
	setLoadableImage('sprites/trashcan/1st.png',1);
	setLoadableImage('sprites/trashcan/2nd.png',1);
	setLoadableImage('sprites/trashcan/3rd.png',1);
	
	// Sounds
	var soundData = [];
	soundData['playerhit'] = {url: './sounds/playerhit.mp3',required:true};
	soundData['entertrashcan'] = {url: './sounds/entertrashcan.mp3',required:true};
	soundData['jump'] = {url: './sounds/jump.mp3',required:true};
	soundData['kick'] = {url: './sounds/kick.mp3',required:true};
	soundData['struggletrashcan'] = {url: './sounds/kick.mp3',required:true};
	soundData['throw'] = {url: './sounds/jump.mp3',required:true};
	soundData['stun'] = {url: './sounds/entertrashcan.mp3',required:true};
	soundData['messageSound'] = {url: './sounds/message.mp3',required:true};
	soundData['wtfSound'] = {url: './sounds/wtfboom.mp3',required:true};
	soundData['gameMusic'] = {url: './sounds/Trash Battle - Disco Query - Start Loop.mp3',loop:true};
	soundData['gameMusic2'] = {url: './sounds/Chains and stains.mp3',loop:true};
	soundData['lobbyMusic'] = {url: './sounds/Mining by Moonlight.mp3',loop:true};
	soundData['playerselectionMusic'] = {url: './sounds/Broken Reality.mp3',loop:true};
	
	loadSounds(soundData);
}

function setLoadedImages()
{
	winbinimg = [];
	winbinimg[1] = loadImage('sprites/trashcan/1st.png');
	winbinimg[2] = loadImage('sprites/trashcan/2nd.png');
	winbinimg[3] = loadImage('sprites/trashcan/3rd.png');
	coinimg = loadImage('sprites/coin/normal.png');
	rankingimg = loadImage('sprites/ranking/normal.png');
	console.log('set rankingimg');
}

var allSoundsLoaded = false;
var allImagesLoaded = false;
function updateLoaded()
{
	if(!allImagesLoaded && imagesLoaded == imagesToBeLoaded)
	{
		allImagesLoaded = true;
		setLoadedImages();
	}
	if(imagesLoaded != imagesToBeLoaded)
	{
		allImagesLoaded = false;
	}
	if(soundsLoaded == soundsToBeLoaded)
	{
		allSoundsLoaded = true;
	}
	else
	{
		allSoundsLoaded = false;
	}
	if(!connected)
	{
		document.getElementById('loadingText').innerHTML = 'Connecting to the game...';
	}
	else if(!allImagesLoaded && !allSoundsLoaded)
	{
		document.getElementById('loadingText').innerHTML = 'Loading sounds and images...';
	}
	else if(allImagesLoaded && !allSoundsLoaded)
	{
		document.getElementById('loadingText').innerHTML = 'Loading sounds...';
	}
	else if(!allImagesLoaded && allSoundsLoaded)
	{
		document.getElementById('loadingText').innerHTML = 'Loading images...';
	}
	else if(allImagesLoaded && allSoundsLoaded)
	{
		loaded = true;
		document.getElementById('loadingText').innerHTML = 'Game loaded. Tap/Click the screen to continue';
	}
	updateLoadedSoundsInfo();
	updateLoadedImagesInfo();
}