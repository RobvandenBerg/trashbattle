<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include('common/index.php');

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
	$email = $_POST['email'];
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
	if(empty($errors) && !valid_email($email))
	{
		$errors = 'The email you entered is invalid!';
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
			$check_email_request = $mysqli -> query('SELECT email from users where email="'.$email.'"');
			if($check_email_request -> num_rows != 0)
			{
				$errors = 'There is already somebody with that email adress!';
			}
		}
		if(empty($errors))
		{
			// Let's register the user
			$registration_key = generate_registration_key();
			$register_request = $mysqli -> query('INSERT into users (username,password,email,registration_key) VALUES ("'.$username.'","'.encrypt_password($password).'","'.$email.'","'.$registration_key.'")');
			$select_id_request = $mysqli -> query('SELECT id from users where username="'.$username.'"') or die($mysqli -> error);
			$select_id_row = $select_id_request -> fetch_assoc();
			$user_id = $select_id_row['id'];
			
			// The user has been inserted, now let's email him
			
			send_registration_mail($username,$email,$user_id,$registration_key);
			
			// Let's store a cookie with the user's email adress for the registered.php page
			$_SESSION['email'] = $email;
			
			// Now let's redirect the user to registered.php
			$mysqli -> close();
			header('location: registered.php');
			echo "<script>window.location='registered.php'</script>";
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
<form method='POST'>
<table>
<tr><td>Username:</td><td><input type='text' name='username' maxlength='20'></td></tr>
<tr><td>Password:</td><td><input type='password' name='password' maxlength='50'></td></tr>
<tr><td>Repeat password:</td><td><input type='password' name='repeatpassword' maxlength='50'></td></tr>
<tr><td>Email:</td><td><input type='text' name='email' maxlength='100'>
<input type='hidden' name='registertime' value='<?php echo microtime(true); ?>'><input type='submit' value='Register!' name='submit'></td></tr>
</table>
</form>