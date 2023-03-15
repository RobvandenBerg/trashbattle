<?php
header('Access-Control-Allow-Origin: *');
include('../common/index.php');

if($_SESSION['loggedin'])
{
	header('location: client');
	exit('<script>window.location="client";</script>');
}
if($_POST['login']) {
	$username = $_POST['username'];
	$password = encrypt_password($_POST['password']);
	
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$check_login_request = $mysqli -> query('SELECT id,username,password,activated,moderator,god,usernameColor from users where username=\''.$mysqli -> real_escape_string($username).'\'');
	if($check_login_request -> num_rows != 1) {
		$errors = 'Invalid username';
	}
	if(empty($errors)) {
		$row = $check_login_request -> fetch_assoc();
		$real_password = $row['password'];
		$activated = $row['activated'];
		if($real_password != $password) {
			$errors = 'Invalid password';
		}
		if(empty($errors) && $activated == 0) {
			$errors = 'Your account is not activated yet! Please click the link in the email we sent you';
		}
		if(empty($errors)) {
			$userid = $row['id'];
			$username = $row['username'];
			$usernameColor = $row['usernameColor'];
			$moderator = $row['moderator'];
			$god = $row['god'];
			$_SESSION['userid'] = $userid;
			$_SESSION['username'] = $username;
			$_SESSION['usernameColor'] = $usernameColor;
			$_SESSION['loggedin'] = true;
			$_SESSION['moderator'] = $moderator;
			$_SESSION['god'] = $god;
				
			// Logged in, let's redirect
			$mysqli->close();
			header('location: client');
			exit('<script>window.location="client";</script>');
		}
	}
	$mysqli->close();
}


?>
<html>
<head>
<title>Log in</title>
</head>
<body>
<?php
if(!empty($errors))
{
	echo '<span style="color: red;">'.$errors.'</span>';
}
?>
<form method='POST'>
<table>
<tr><td>Username</td><td><input type='text' name='username' maxlength='20'></td></tr>
<tr><td>Password</td><td><input type='password' name='password' maxlength='50'></td></tr>
<tr><td colspan='2'><input type='submit' value='Log in' name='login'> | <a href='register.php'>Register</a> | <a href='forgotpassword.php'>Forgot password?</a></td></tr>
</table>
</form>
</body>
</html>