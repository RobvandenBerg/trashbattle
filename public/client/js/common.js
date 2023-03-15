var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    	// If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    	// If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    	// If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();




var loginAjax=new XMLHttpRequest();
var loggedIn = false;
var m = false;
var uname = null;
var initializedLogin = false;
var mobile = false;
var coins = 0;
var ranking = 0;

function getLoginInfo(doneFunction)
{
	loginAjax.onreadystatechange=function()
	{
		if (loginAjax.readyState==4)
		{
			if(loginAjax.status==200)
			{
				var resp = loginAjax.responseText;
				var response = JSON.parse(resp);
				if(response.data)
				{
					loggedIn = response.data.loggedIn;
					m = response.data.m;
					uname = response.data.username;
					coins = response.data.coins;
					ranking = response.data.ranking;
				}
				initializedLogin = true;
				if(doneFunction)
				{
					doneFunction();
				}
			}
		}
	}
	loginAjax.open("GET","http://trashbattle.com/ajax/account.php?method=getuserinfo&t="+Math.random(),true);
	loginAjax.send();
}

function enterGame(gameid,doneFunction)
{
	loginAjax.onreadystatechange=function()
	{
		if (loginAjax.readyState==4)
		{
			if(loginAjax.status==200)
			{
				var resp = loginAjax.responseText;
				var response = JSON.parse(resp);
				if(response.error)
				{
					window.location = './?msg='+encodeURI(response.error);
					return;
				}
				loggedIn = response.loggedIn;
				m = response.m;
				uname = response.username;
				mobile = response.mobile;
				sessid = response.sessid;
				p = response.p;
				userid = response.userid;
				chatEnabled = response.chat;
				server = response.server;
				port = response.port;
				initializedLogin = true;
				console.log(response);
				if(doneFunction)
				{
					doneFunction();
				}
			}
		}
	}
	loginAjax.open("GET","http://trashbattle.com/ajax/joingame.php?id="+gameid+"&t="+Math.random(),true);
	loginAjax.send();
}

function profile_picture_url(memberid)
{
	return 'http://trashbattle.com/profile_pics/'+memberid+'.png';
}

function profile_picture(memberid)
{
	return '<img class="profile_picture" src="'+profile_picture_url(memberid)+'" onerror="this.src=\'http://trashbattle.com/client/images/default_profile_picture.png\'">';
}