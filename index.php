<html>
<html>
<head>
<title>Trash Battle</title>
</head>
<body>
<h1>Trash Battle!</h1>
<h3>A project that died.</h3>
<?php
include('common/index.php');

if($_SESSION['loggedin'])
{
	echo 'Welcome, ' . $_SESSION['username'] . '!<br><a href="login.php">Start playing</a>';
}
else
{
	/*
?>
<a href='login.php'>Log in!</a><br>
<a href='register.php'>Register!</a>
<?php
*/
}
?>
</body>
</html>