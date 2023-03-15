var account = 
(function () {
		var ajaxRequest = new XMLHttpRequest();
	
		var account = {
			version: 1.0,
			author: "Rob van den Berg, Mitchell Olsthoorn",
			updated: "",
			logIn: function(data, successFunction, errorFunction) {
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
		
				ajaxRequest.open("POST","http://trashbattle.com/ajax/account.php?method=login&t=" + Math.random(),true);
				ajaxRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				ajaxRequest.send("username=" + data.username + "&password=" + data.password);
			},
			logOut: function(successFunction, errorFunction) {
				ajaxRequest.onreadystatechange = function() {
					if (ajaxRequest.readyState == 4) {
						if(ajaxRequest.status == 200) {
							var resp = ajaxRequest.responseText;
							var response = JSON.parse(resp);
							var success = response.success;
							
							if (success && successFunction) {
								successFunction();
							} else if (errorFunction) {
								errorFunction(response.msg);
							}
						}
					}
				}
		
				ajaxRequest.open("GET","http://trashbattle.com/ajax/account.php?method=logout&t=" + Math.random(),true);
				ajaxRequest.send();
			},
			getUserInfo: function() {

			}
		}
			
		return account;
}());