function playSound(soundName) {
	if (!sounds[soundName]) {
		console.log('could not find sound '+soundName);
		return;
	}
	if (sound) {
		sounds[soundName].stop();
		sounds[soundName].play();
	}
}

function stopSound(soundName)
{
	if(sounds[soundName])
	{
		sounds[soundName].pause();
	}
}
function loadSounds(soundData)
{
	for(var soundName in soundData)
	{
		var currentSound = soundData[soundName];
		var soundonload = null;
		var loop = false;
		if(currentSound.required)
		{
			soundsToBeLoaded++;
			updateLoaded();
			soundonload = newSoundLoaded;
		}
		if(currentSound.loop)
		{
			loop = currentSound.loop;
		}
		sounds[soundName] = new Howl({
		  src: [currentSound.url],
			onload: soundonload,
			loop: loop
		});
	}
}