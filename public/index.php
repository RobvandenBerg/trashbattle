<?php
require_once('../common/index.php');
?>
<!DOCTYPE HTML>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>TrashBattle</title>
	<meta name="description" content="">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="css/normalize.css">
	<link rel="stylesheet" href="css/main.css">
	<script src="client/js/account.js"></script>
	<script>
	window.onload = function() {
		var theDaysBox  = document.getElementById('numdays');
		var theHoursBox = document.getElementById('numhours');
		var theMinsBox  = document.getElementById('nummins');
		var theSecsBox  = document.getElementById('numsecs');
		
		var refreshId = setInterval(function() {
		  var currentSeconds = theSecsBox.innerHTML;
		  var currentMins    = theMinsBox.innerHTML;
		  var currentHours   = theHoursBox.innerHTML;
		  var currentDays    = theDaysBox.innerHTML;
		  
		  if(currentSeconds == 0 && currentMins == 0 && currentHours == 0 && currentDays == 0) {
			
			
		  } else if(currentSeconds == 0 && currentMins == 0 && currentHours == 0) {
			// if the seconds and minutes and hours run out we subtract 1 day
			theDaysBox.innerHTML = currentDays-1;
			theHoursBox.innerHTML = "23";
			theMinsBox.innerHTML = "59";
			theSecsBox.innerHTML = "59";
		  } else if(currentSeconds == 0 && currentMins == 0) {
			// if the seconds and minutes run out we need to subtract 1 hour
			theHoursBox.innerHTML = currentHours-1;
			theMinsBox.innerHTML = "59";
			theSecsBox.innerHTML = "59";
		  } else if(currentSeconds == 0) {
			// if the seconds run out we need to subtract 1 minute
			theMinsBox.innerHTML = currentMins-1;
			theSecsBox.innerHTML = "59";
		  } else {
			theSecsBox.innerHTML = currentSeconds-1;
		  }
	   }, 1000);
	}
	
	function logIn() {
		var username = document.getElementById('username');
		var password = document.getElementById('password');
		
		document.getElementById('view').innerHTML = '<img src="img/ajax-loader.gif">';
		
		var data = {'username': username.value, 'password': password.value};
		account.logIn(data, displayLoggedInView, displayError);
	}
	
	function logOut() {
		document.getElementById('view').innerHTML = '<img src="img/ajax-loader.gif">';
		account.logOut(displayFormView);
	}
				
	function displayFormView() {
		var formView = 	"<form onkeypress='submitOnEnter(event)'>";
			formView +=	"<table>";
			formView +=	"<tr><td><input id='username' class='input' type='text' name='username' maxlength='20' placeholder='Username'></td></tr>";
			formView +=	"<tr><td><input id='password' class='input' type='password' name='password' maxlength='50' placeholder='Password'></td></tr>";
			formView +=	"<tr><td><input id='login' class='button-link' type='button' value='Log in' name='login' onclick='logIn()'> | <a href='register.php'>Register</a></td></tr>";
			formView +=	"</table>";
			formView +=	"</form>";
			
		document.getElementById('view').innerHTML = formView;
	}
	
	function displayLoggedInView(data) {
		var loggedInView = 	"<p>Welcome, " + data.username + "</p>";
			loggedInView +=	"<a class='button-link' href='http://trashbattle.com/client'>Start playing</a> | <span class='text-link' onclick='logOut()'>Log out</span>";
			//loggedInView +=	"<a class='button-link' onClick='alert(\"You cannot play Trash Battle right now, because the game is not released yet.\");'>Start playing</a> | <span class='text-link' onclick='logOut()'>Log out</span>";
			
		document.getElementById('view').innerHTML = loggedInView;
	}
	
	function displayError(msg) {
		displayFormView();
		
		var content = document.getElementById('view').innerHTML;
		
		document.getElementById('view').innerHTML = "<div class='callout callout-danger'>" + msg + "</div>" + content;
	}
	
	function submitOnEnter(event) {
		if (event.keyCode == 13) {
			logIn();
		}
	}
	</script>
</head>
<body>
	<div id="header-container">
		<header id="header" class="block">
			<span id="title">Trash Battle!</span>
			<span id="subtitle">A work in progress</span>
		</header>
	</div>
	<div id="main-container">
		<main id="main" class="group block">
			<aside id="sidebar">
				<span class="section-title">Account</span>
				<div id="view">
					<?php

					if($_SESSION['loggedin']) {
					?>
						<p>Welcome,  <?php echo $_SESSION['username'] ?></p>
						<a class="button-link" href="http://trashbattle.com/client">Start playing</a> | <span class='text-link' onclick='logOut()'>Log out</span>
						<?php //<a class="button-link" onClick='alert("Shush. Be patient, this game aint even done yet yo");'>Start playing</a> | <span class='text-link' onclick='logOut()'>Log out</span>
					
					}
					else {
					?>
						<form onkeypress='submitOnEnter(event)'>
							<table>
								<tr><td><input id='username' class="input" type='text' name='username' maxlength='20' placeholder="Username"></td></tr>
								<tr><td><input id='password' class="input" type='password' name='password' maxlength='50' placeholder="Password"></td></tr>
								<tr><td><input id='login' class="button-link" type='button' value='Log in' name='login' onclick="logIn()"> | <a href='register.php'>Register</a></td></tr>
							</table>
						</form>
					<?php
					}
					?>
				</div>
			</aside>
			<section id="content">
				<span class="section-title">Gameplay video (We didn't know the webcam was recording, but we kept the footage in because it's funny!)</span>
				<video width="100%" controls>
				  <source src="gameplay2.mp4" type="video/mp4">
					Your browser does not support this video
				</video>
				<br>
				<br>
				<span class="section-title">Gameplay video 2</span>
				<video width="100%" controls>
				  <source src="footage2.mp4" type="video/mp4">
					Your browser does not support this video
				</video>
				<br>
				<br>
				Older video:<br>
				<video width="100%" controls>
				  <source src="gameplay.webm" type="video/webm">
				  <source src="gameplay.mp4" type="video/mp4">
					Your browser does not support this video
				</video>
				<?php /*
				<div class="text">
					<h3>This game is in development, and won't be made public until:</h3>
					<div class="clock-ticker" class="clearfix">
						<div class="unit">
							<span class="flip-top" id="numdays"><?php
							$then = new DateTime("2015-10-24 00:00:00");
							$now = new DateTime("now");
							$left = $now->diff($then)->format("%a,%h,%i,%s");
							$split = explode(',',$left);
							echo $split[0];
							?></span>
							<footer class="label">Days</footer>
						</div>
						<div class="unit">
							<span class="flip-top" id="numhours"><?php echo $split[1];?></span>
							<footer class="label">Hours</footer>
						</div>
						<div class="unit">
							<span class="flip-top" id="nummins"><?php echo $split[2];?></span>
							<footer class="label">Minutes</footer>
						</div>
						<div class="unit">
							<span class="flip-top" id="numsecs"><?php echo $split[3];?></span>
							<footer class="label">Seconds</footer>
						</div>
					</div>*/?>
					<?php
					/*
					<form class="searchbox">
						<input id="search-input"class="input" type="text" placeholder="Email address">
						<input id="submit-link" class="button-link" type="button" value="Notify" >
					</form>
					*/
					?>
				</div>
				<div class="clear"></div>
			</section>
		</main>
	</div>
	<div id="footer-container">
		<footer id="footer" class="block">Copyright (c) TrashBattle <?php echo date("Y", time()); ?></footer>
	</div>
</body>
</html>