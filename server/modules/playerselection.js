var playerselection =
{
	selectablePlayers: [],
	selectedPlayers: [],
	updateFunction: function(){},
	cutoff: false,
	addSelectablePlayer: function(name,x,y,sprite)
	{
		var selectable = {name: name, x: x, y: y, sprite: sprite};
		this.selectablePlayers.push(selectable);
	},
	startSelection: function(userNamesList)
	{
		this.selectedPlayers = [];
		this.cutoff = false;
		var x = 0;
		var colors = ['red','blue','yellow','green'];
		for(var i in userNamesList)
		{
			var username = userNamesList[i];
			x++;
			this.hoverPlayer(username,x,1,true,colors[i]);
		}
		this.sendUpdate();
	},
	hoverPlayer: function(username,x,y,silent,setColor)
	{
		if(this.cutoff)
		{
			return;
		}
		for(var i in this.selectablePlayers)
		{
			if(this.selectablePlayers[i].x == x && this.selectablePlayers[i].y == y)
			{
				// This is the correct player
				if(!this.selectedPlayers[username])
				{
					this.selectedPlayers[username] = [i,false];
				}
				if(this.selectedPlayers[username][1])
				{
					// The player already selected a character, so you cannot hover over a new one
					return;
				}
				
				this.selectedPlayers[username][0] = i;
				if(setColor)
				{
					console.log('update player color to ' +setColor);
					this.selectedPlayers[username][2] = setColor;
				}
				if(!silent)
				{
					this.sendUpdate();
				}
			}
		}
	},
	selectPlayer: function(username,x,y)
	{
		if(this.cutoff)
		{
			return;
		}
		for(var i in this.selectablePlayers)
		{
			if(this.selectablePlayers[i].x == x && this.selectablePlayers[i].y == y)
			{
				if(this.selectedPlayers[username][1])
				{
					// The player already selected a character, so you cannot select a new one
					return;
				}
				if(!this.playerIsSelected(i) && this.selectedPlayers[username])
				{
					this.selectedPlayers[username][0] = i;
					this.selectedPlayers[username][1] = true;
					this.sendUpdate();
				}
			}
		}
		if(this.everybodyChose())
		{
			// Everybody chose a character, let's cut off
			this.cutOff();
		}
	},
	unselectPlayer: function(username)
	{
		if(this.cutoff)
		{
			return;
		}
		this.selectedPlayers[username][1] = false;
		this.sendUpdate();
	},
	playerIsSelected: function(index)
	{
		
		for(var username in this.selectedPlayers)
		{
			if(this.selectedPlayers[username][0] == index && this.selectedPlayers[username][1])
			{
				return true;
			}
		}
		return false;
	},
	getData: function()
	{
		var returner = [];
		for(var i in this.selectablePlayers)
		{
			returner[i] = {name: this.selectablePlayers[i].name, sprite: this.selectablePlayers[i].sprite, x: this.selectablePlayers[i].x, y: this.selectablePlayers[i].y, hoveringUsers: [], selectedUser: null};
			for(var username in this.selectedPlayers)
			{
				if(this.selectedPlayers[username][0] == i)
				{
					var color = this.selectedPlayers[username][2];
					// The player selected/hovers this selectable player
					if(this.selectedPlayers[username][1])
					{
						returner[i].selectedUser = [username,color];
					}
					else
					{
						returner[i].hoveringUsers.push([username,color]);
					}
				}
			}
		}
		return returner;
	},
	removePlayer: function(username,force)
	{
		if(this.cutoff && !force)
		{
			return;
		}
		if(this.selectedPlayers[username])
		{
			delete this.selectedPlayers[username];
			this.sendUpdate();
		}
	},
	setUpdateFunction: function(func)
	{
		this.updateFunction = func;
	},
	sendUpdate: function()
	{
		this.updateFunction();
	},
	
	cutOff: function()
	{
		// Let's force everybody to choose a character and send back the results
		this.cutoff = true;
		var returner = [];
		for(var username in this.selectedPlayers)
		{
			if(this.selectedPlayers[username][1])
			{
				// This player has chosen, so just push it
				returner.push([username,this.selectablePlayers[this.selectedPlayers[username][0]].sprite]);
			}
			else
			{
				// This player has not chosen yet
				
				// First let's look if the character he's hovering is still available
				var hoveringAvailable = true;
				var hovering = this.selectedPlayers[username][0];
				for(var j in this.selectedPlayers)
				{
					if(this.selectedPlayers[j][1] && this.selectedPlayers[j][0] == hovering)
					{
						// Some other player already chose this character
						hoveringAvailable = false;
					}
				}
				
				if(hoveringAvailable)
				{
					// Let's assign this character to him
					this.selectedPlayers[username][1] = true;
					returner.push([username,this.selectablePlayers[hovering].sprite]);
				}
				else
				{
					// Let's assign a non taken character
					var assignedCharacter = this.nonTakenCharacter();
					this.selectedPlayers[username][0] = assignedCharacter;
					this.selectedPlayers[username][1] = true;
					returner.push([username,this.selectablePlayers[assignedCharacter].sprite]);
				}
			}
		}
		
		return returner;
	},
	
	everybodyChose: function()
	{
		for(var i in this.selectedPlayers)
		{
			if(!this.selectedPlayers[i][1])
			{
				return false;
			}
		}
		return true;
	},
	
	nonTakenCharacter: function()
	{
		for(var i in this.selectablePlayers)
		{
			var available = true;
			for(var j in this.selectedPlayers)
			{
				if(this.selectedPlayers[j][1] && this.selectedPlayers[j][0] == i)
				{
					available = false;
				}
			}
			if(available)
			{
				return i;
			}
		}
		return null;
	}
	
}

playerselection.addSelectablePlayer('Trashman red',1,1,'trashmanred');
playerselection.addSelectablePlayer('Trashman blue',2,1,'trashmanblue');
playerselection.addSelectablePlayer('Trashman green',3,1,'trashmangreen');
playerselection.addSelectablePlayer('Trashman yellow',4,1,'trashmanyellow');

module.exports = playerselection;