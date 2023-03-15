

var timeConversion = function(seconds)
{
	var quantity = seconds;
	var unit = 'seconds';
	if(quantity > 60)
	{
		quantity = quantity/60;
		unit = 'minutes';
		if(quantity > 60)
		{
			quantity = quantity/60;
			unit = 'hours';
			if(quantity > 48)
			{
				quantity = quantity/24;
				unit = 'days';
				if(quantity > 14)
				{
					quantity = quantity/7;
					unit = 'weeks';
					if(quantity > 8)
					{
						quantity = quantity/4.357;
						unit = 'months';
						if(quantity > 24)
						{
							quantity = quantity/12;
							unit = 'years';
						}
					}
				}
			}
		}
	}
	return {quantity: Math.ceil(quantity),unit: unit};
}

module.exports = timeConversion;