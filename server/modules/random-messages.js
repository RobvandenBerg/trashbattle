var random =
function () {
	var array = ["a","b","c","zelfs abc","ojo jij bent een mens","Ik ben een server :D"];
	var num = Math.floor((Math.random() * array.length));
	return array[num];
};

module.exports = random;