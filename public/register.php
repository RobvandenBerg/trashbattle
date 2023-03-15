<?php

include('../common/index.php');

session_start();

if(isset($_POST['submit']))
{
	$registertime = $_POST['registertime'];
	$errors = '';
	if($_SESSION['registertime'] == $registertime)
	{
		$errors = 'Oops, a double post occured! You may or may not have been registered';
	}
	$_SESSION['registertime'] = $registertime;
	$username = $_POST['username'];
	$password = $_POST['password'];
	$repeat_password = $_POST['repeatpassword'];
	if(empty($errors) && strlen($username) < 3)
	{
		$errors = 'Your username must be at least three characters!';
	}
	if(empty($errors) && strlen($username)  > 20)
	{
		$errors = 'Your username must be shorter than twenty characters!';
	}
	if(empty($errors) && !valid_username($username))
	{
		$errors = 'Your username must be alphanumeric!';
	}
	if(empty($errors) && strlen($password) < 5)
	{
		$errors = 'Your password must be at least five characters!';
	}
	if(empty($errors) && $password != $repeat_password)
	{
		$errors = 'The entered passwords do not match!';
	}
	if(empty($errors))
	{
		$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
		$check_username_request = $mysqli -> query('SELECT username from users where username="'.$username.'"');
		if($check_username_request -> num_rows != 0)
		{
			$errors = 'There is already somebody with the username ' . $username . '!';
		}
		if(empty($errors))
		{
			// Let's register the user
			//$registration_key = generate_registration_key();
			$register_request = $mysqli -> query('INSERT into users (username,password,activated) VALUES ("'.$username.'","'.encrypt_password($password).'",1)') or die($mysqli -> error);
			$select_id_request = $mysqli -> query('SELECT id from users where username="'.$username.'"') or die($mysqli -> error);
			$select_id_row = $select_id_request -> fetch_assoc();
			$user_id = $select_id_row['id'];
			
			// The user has been inserted, now let's email them
			
			//send_registration_mail($username,$email,$user_id,$registration_key);

			
			$_POST['login'] = true;
			$mysqli -> close();
			include('login.php');
			exit();
		}
		$mysqli -> close();
	}
}

if(!empty($errors))
{
	echo '<span style="color: red;">' . $errors . '</span><br>';
}

?>
<form method='POST' action='register.php<?php if($_GET['mobile']){ echo '?mobile=1';}?>'>
<table>
<tr><td>Username:</td><td><input type='text' name='username' maxlength='20'></td></tr>
<tr><td>Password:</td><td><input type='password' name='password' maxlength='50'></td></tr>
<tr><td>Repeat password:</td><td><input type='password' name='repeatpassword' maxlength='50'></td></tr>
<input type='hidden' name='registertime' value='<?php echo microtime(true); ?>'><input type='submit' value='Register!' name='submit'></td></tr>
</table>
</form>