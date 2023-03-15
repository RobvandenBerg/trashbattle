function fetch_profile(username)
{
	var ajaxRequest = new XMLHttpRequest();
	ajaxRequest.onreadystatechange = function() {
		if (ajaxRequest.readyState == 4) {
			if(ajaxRequest.status == 200) {
				var resp = ajaxRequest.responseText;
				var response = JSON.parse(resp);
				var success = response.success;
				if (success && successFunction) {
					successFunction(response.data);
				} else if (errorFunction) {
					errorFunction(response.msg);
				}
			}
		}
	}
		
	ajaxRequest.open("GET","http://trashbattle.com/ajax/profile.php?username="+username+"&action=fetch&t=" + Math.random(),true);
	ajaxRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	ajaxRequest.send();
}

var aboutme = '';
var editingAboutme = false;

var privileged = false;
function successFunction(data)
{
	var username = data.username;
	var id = data.id;
	profileUsername = username;
	var coins = data.coins;
	var ranking = data.ranking;
	var registered = data.registered;
	var moderator = data.moderator;
	var god = data.god;
	profileId = data.id;
	aboutme = data.aboutme;
	
	var titles = document.getElementsByTagName('title');
	titles[0].innerHTML = username+'\'s profile - Trash Battle';
	
	privileged = false;
	if(m || username == uname)
	{
		// This user can edit the profile
		privileged = true;
	}
	
	var output = '';
	
	output = '<span style="header">'+username+'\'s profile</span><br><div id="profile_picture_display">'+profile_picture(profileId)+'<br>';
	if(privileged)
	{
		output += '<span class="spanlink" onclick="changeProfilePicture();">Change profile picture</span>';
	}
	output += '</div><br>';
	
	output += '<table class="infotable" border="1" cellspacing="0" cellpadding="3">';
	output += '<tr><td>Member since</td><td>'+registered+'</td></tr>';
	output += '<tr><td>Coins</td><td>'+coins+'</td></tr>';
	output += '<tr><td>Ranking</td><td>'+ranking+'</td></tr>';
	if(moderator)
	{
		output += '<tr><td colspan="2">'+username+' is a moderator</td></tr>';
	}
	if(god)
	{
		output += '<tr><td colspan="2">'+username+' has god privileges</td></tr>';
	}
	output += '</table><br><br>';
	var displayAboutme = nl2br(aboutme);
	if(displayAboutme == '')
	{
		displayAboutme = 'This user has not entered anything about himself yet.';
	}
	output += '<div class="aboutmeWrapper">About '+username;
	if(privileged)
	{
		// This user can edit the profile
		output += ' (<span class="spanlink" onclick="editAboutme();">Edit</span>)';
	}
	output += ':<div id="aboutme">'+displayAboutme+'<div>';
	
	output += '<div class="linkWrapper"><b>Trash Battle - 3DSPlaza account link:</b><br>'+username+' is linked to this 3DSPlaza account: <span id="plaza_link"></span><span onClick="seeLink();" id="seelinklink" class="spanlink">Click here to see</span><br><div id="linkupdater"></div></div>';
	
	output += '</div>';
	
	document.getElementById('profileContent').innerHTML = output;
	
}

function seeLink()
{
	document.getElementById('seelinklink').setAttribute('class', '');
	document.getElementById('seelinklink').innerHTML = 'Loading...';
	document.getElementById('seelinklink').setAttribute('onclick', "");
	var ajaxRequest = new XMLHttpRequest();
	ajaxRequest.onreadystatechange = function() {
		if (ajaxRequest.readyState == 4) {
			if(ajaxRequest.status == 200) {
				var resp = ajaxRequest.responseText;
				var response = JSON.parse(resp);
				var success = response.success;
				if (success && successFunction) {
					seeLinkSuccessFunction(response.linked_plaza_username);
				} else if (errorFunction) {
					seeLinkErrorFunction(response.msg);
				}
			}
		}
	}
		
	ajaxRequest.open("GET","http://trashbattle.com/ajax/link.php?username="+profileUsername+"&action=fetch&t=" + Math.random(),true);
	ajaxRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	ajaxRequest.send();
}

function seeLinkSuccessFunction(linked_plaza_username)
{
	if(document.getElementById('seelinklink'))
	{
		document.getElementById('seelinklink').parentElement.removeChild(document.getElementById('seelinklink'));
	}
	if(linked_plaza_username)
	{
		document.getElementById('plaza_link').innerHTML = linked_plaza_username;
	}
	else
	{
		// Not linked yet
		document.getElementById('plaza_link').innerHTML = 'No link established yet';
		if(privileged)
		{
			var addHTML = 'Add a 3DSPlaza account:<br>3DSPlaza username: <input type="text" id="3dsplaza_username"><br>';
			if(!privileged)
			{
				addHTML += '3DSPlaza password: <input type="password" id="3dsplaza_password"><br>';
			}
			addHTML += '<input type="button" value="Link 3DSPlaza account" onclick="link3DSPlazaAccount();">';
			document.getElementById('linkupdater').innerHTML = addHTML;
		}
	}
}

function seeLinkErrorFunction(msg)
{
	if(document.getElementById('seelinklink'))
	{
		document.getElementById('seelinklink').setAttribute('class', 'spanlink');
		document.getElementById('seelinklink').innerHTML = 'see';
		document.getElementById('seelinklink').setAttribute('onclick', "seeLink();");
	}
	alert(msg);
}

function updateLinkError(msg)
{
	document.getElementById('linkupdater').innerHTML = '<span class="error">Error: ' + msg + '</span><br>Add a 3DSPlaza account:<br>3DSPlaza username: <input type="text" id="3dsplaza_username"><br>3DSPlaza password: <input type="password" id="3dsplaza_password"><br><input type="button" value="Link 3DSPlaza account" onclick="link3DSPlazaAccount();">';
}

function updateLinkSuccess(linked_plaza_username)
{
	if(document.getElementById('linkupdater'))
	{
		document.getElementById('linkupdater').parentElement.removeChild(document.getElementById('linkupdater'));
	}
	document.getElementById('plaza_link').innerHTML = linked_plaza_username;
}

function link3DSPlazaAccount()
{
	var sendPlazaUsername = document.getElementById('3dsplaza_username').value;
	var sendPlazaPassword = '';
	if(document.getElementById('3dsplaza_password'))
	{
		sendPlazaPassword = document.getElementById('3dsplaza_password').value;
	}
	document.getElementById('linkupdater').innerHTML = 'Updating link...';
	var ajaxRequest = new XMLHttpRequest();
	ajaxRequest.onreadystatechange = function() {
		if (ajaxRequest.readyState == 4) {
			if(ajaxRequest.status == 200) {
				var resp = ajaxRequest.responseText;
				var response = JSON.parse(resp);
				var success = response.success;
				if (success) {
					updateLinkSuccess(response.linked_plaza_username);
				} else {
					updateLinkError(response.msg);
				}
			}
		}
	}
	ajaxRequest.open("POST","http://trashbattle.com/ajax/link.php?username="+profileUsername+"&action=link&t=" + Math.random(),true);
	ajaxRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	ajaxRequest.send("plaza_username="+sendPlazaUsername+"&plaza_password="+sendPlazaPassword);
}

function seeLinkErrorFunction(message)
{
	document.getElementById('profileContent').innerHTML = '<span class="error">'+message+'</span>';
}

function errorFunction(message)
{
	document.getElementById('profileContent').innerHTML = '<span class="error">'+message+'</span>';
}


function goToProfile()
{
	var goToUsername = document.getElementById('goToUser').value;
	if(goToUsername == '')
	{
		return;
	}
	window.location = './profile.html?username='+goToUsername;
}

function editAboutme()
{
	if(editingAboutme)
	{
		return;
	}
	editingAboutme = true;
	//var aboutme = document.getElementById('aboutme').innerHTML;
	document.getElementById('aboutme').innerHTML = '<textarea id="editAboutme">'+aboutme+'</textarea><br>';
	document.getElementById('aboutme').innerHTML += '<input type="button" value="Save" onclick="saveAboutme();"> ';
	document.getElementById('aboutme').innerHTML += '<input type="button" value="Cancel" onclick="cancelAboutme();">';
}

function saveAboutme()
{
	var sendaboutme = document.getElementById('editAboutme').value;
	document.getElementById('aboutme').innerHTML = 'Saving...';
	var ajaxRequest = new XMLHttpRequest();
	ajaxRequest.onreadystatechange = function() {
		if (ajaxRequest.readyState == 4) {
			if(ajaxRequest.status == 200) {
				var resp = ajaxRequest.responseText;
				var response = JSON.parse(resp);
				var success = response.success;
				if (success) {
					aboutme = response.aboutme;
				} else {
					alert(response.msg);
				}
				toNormalAboutmeMode();
			}
		}
	}
	ajaxRequest.open("POST","http://trashbattle.com/ajax/profile.php?username="+profileUsername+"&action=saveAboutme&t=" + Math.random(),true);
	ajaxRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	ajaxRequest.send("aboutme="+sendaboutme);
}

function cancelAboutme()
{
	toNormalAboutmeMode();
}

function toNormalAboutmeMode()
{
	editingAboutme = false;
	var displayAboutme = nl2br(aboutme);
	if(displayAboutme == '')
	{
		displayAboutme = 'This user has not entered anything about himself yet.';
	}
	document.getElementById('aboutme').innerHTML = displayAboutme;
}

function changeProfilePicture()
{
	document.getElementById('profile_picture_display').innerHTML = '<iframe id="profile_picture_changer" src="http://trashbattle.com/profile_picture.php?memberid='+profileId+'"></iframe><br><input type="button" value="Done" onclick="doneProfilePictureChanging();">';
}

function doneProfilePictureChanging()
{
	document.getElementById('profile_picture_display').innerHTML = profile_picture(profileId) + '<br><span class="spanlink" onclick="changeProfilePicture();">Change profile picture</span>';
}

function nl2br(str, is_xhtml) {

  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display

  return (str + '')
    .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}