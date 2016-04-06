export function filter (entity, prop, value) {
  const parts = prop.split('_');
  if (parts.length === 1) {
		  return entity[prop] === value;
  } else {
	  const field = parts.slice(0, parts.length - 1).join('_');
	  switch(parts[parts.length -1]){
		  case 'cts':
		  for(let i = 0; i < value.length; i++) {
			  if (!(entity[field].indexOf(value[i]) >= 0)) {
					  return false;
			  }
		  }
	  }
  }

  return true;
}

export function filterSlice(entity, slice) {
  for (let prop in slice.filter) {
	  if (!filter(entity, prop, slice.filter[prop])) {
		  return false;
	  }
  }
  return true;
}
