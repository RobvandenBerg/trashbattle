<?php
include('../common/index.php');

?><html>
<head>
<title>Welcome!</title>
<body>You have succesfully signed up to Trash Battle!<br><br>
However, before you can play, we ask you to confirm your email adress by clicking the link we sent you to <?php echo $_SESSION['email']; ?>. After that, you'll be able to login and play Trash Battle :)<br>
<br>
If you can't find it, try checking your spam folder, and otherwise you're outta luck xP<br><br>
<?php
if($_GET['mobile'])
{
	echo 'Please close the app, activate your account, then after that reopen the app';
}
?>
</body>
</html>