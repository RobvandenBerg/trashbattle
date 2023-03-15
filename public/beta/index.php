<?php
include('../../common/index.php');
$error = '';
session_start();
if($_POST['3DSPlaza_username'])
{
	
	include('../../../3dsplaza/members/db_leden.php');
	$uname = $_POST['3DSPlaza_username'];
	$pword = $_POST['3DSPlaza_password'];
	$pword= sha1($pword);
	$pword= $pword . "sl";
	$pword= md5($pword);
	
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$check_username_request = $mysqli -> query('SELECT gebruikersnaam, wachtwoord, trashbattle_beta_access, trashbattle_user_id from ledengegevens where gebruikersnaam="'.$mysqli -> real_escape_string($uname).'"');
	if($check_username_request -> num_rows != 1)
	{
		$error = 'That 3DSPlaza username does not exist!';
	}
	else
	{
		$row = $check_username_request -> fetch_assoc();
		$uname = $row['gebruikersnaam'];
		$check_pword = $row['wachtwoord'];
		$access = $row['trashbattle_beta_access'];
		$tb_user_id = $row['trashbattle_user_id'];
		
		if($pword != $check_pword)
		{
			$error = 'Incorrect 3DSPlaza login information!';
		}
		else
		{
			if(!$access)
			{
				$error = 'Your 3DSPlaza account does not have Trash Battle Beta access!';
			}
			else
			{
				if($tb_user_id)
				{
					$error = 'You already used the 3DSPlaza Trash Battle Beta programme!';
				}
				else
				{
					$_SESSION['beta_access'] = 1;
					$_SESSION['3DSPlaza_username'] = $uname;
				}
			}
		}
		//echo $
	}
}


if($_SESSION['beta_access'])
{
	// Show you got beta access page
	?>
	<h1>Congratulations! You have Beta Access to Trash Battle!</h1>
	<?php echo $_SESSION['3DSPlaza_username']; ?>, you can sign up for Trash Battle! Sign up <a href='http://trashbattle.com/register.php'>here</a> for a Trash Battle Beta account!<br><br>Watch out, you can only register for the beta once! Make sure you enter your desired username and email address correctly!<br><br>
	<?php
	exit();
}


if($error)
{
	echo '<span style="color: red;">'.$error.'</span><br>';
}
?>

Did you get BETA access to Trash Battle?<br>
<br>
Enter your 3DSPlaza account info here, we will check if your 3DSPlaza account has Trash Battle beta access. If you do, you can create your Trash Battle account!<br>
<br>
<form method='POST'>
Your 3DSPlaza username: <input type='text' name='3DSPlaza_username'><br>
Your 3DSPlaza password: <input type='password' name='3DSPlaza_password'><br>
<input type='submit' value='Check!'>
</form>