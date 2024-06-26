var splitURL = window.location.href.split("/");
const urlToSendTo = "http://" + splitURL[2] + "/recieve";
var ingredients; //const, but it has to be set with json file later
var unitList; //const, but it has to be set with json file later
const ingredientTemplate = document.getElementById("ingredient-template");
const ingredientContainer = document.getElementById("ingredient-container");
const ingredientDataList = document.getElementById("ingredient-datalist");
const ingredientParentTemplate = document.getElementById("ingredient-sub-template")
loadLists();


//if specific recipe in the url set those values
if(document.URL.split("/")[document.URL.split("/").length - 1] != "recipe"){
	editRecipe(document.URL.split("/")[document.URL.split("/").length - 1]);	
}
else{
	addIngredient();
}

async function httpNewIngredient(displayName, url, callback){
	var xmlHttp = new XMLHttpRequest();

	var IDName = displayName.toLowerCase().replaceAll(" ", "");

	var jsonFile = {};
	jsonFile[IDName] = {};
	jsonFile[IDName]["displayName"] = displayName;
	jsonFile[IDName]["cost"] = -1;
	jsonFile[IDName]["tableToGram"] = -1;
	jsonFile[IDName]["health"] = {"saturated fats": -1, "calories": -1 };
	jsonFile[IDName]["type"] = "";
	jsonFile[IDName]["parent"] = "ingredients";
	jsonFile[IDName]["substitutes"] = {};
	jsonFile[IDName]["specialized"] = false;
	jsonFile[IDName]["restrictions"] = [""];
	jsonFile[IDName]["notes"] = [""];
	jsonFile[IDName]["needsMoreInfo"] = true;

	//send the json file
    xmlHttp.open("POST", url, true); // true for asynchronous
	xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify(jsonFile));

	// Set an event listener for when the request state changes
    xmlHttp.onreadystatechange = function() {
        // Check if the request is complete and successful
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            // Call the callback function with the response text
            callback(xmlHttp.responseText);
		}
    }
}

// Define a function to send an HTTP request asynchronously
async function httpGetAsync(theUrl, callback) {
    // Create a new XMLHttpRequest object
    var xmlHttp = new XMLHttpRequest();

	//get all data from page
	var IDName = document.getElementById("name-input").value.toLowerCase().replaceAll(" ", "");
	var displayName = document.getElementById("name-input").value;
	var totalTime = document.getElementById("total-time-input").value;
	var effortTime = document.getElementById("effort-time-input").value;
	var type = document.getElementById("type-input").value;
	var ethnicity = document.getElementById("ethnicity-input").value
	var difficulty = document.getElementById("difficulty-input").value
	var servings = document.getElementById("servings-input").value
	var directionsList = document.getElementById("directions-input").value.replace(/(\r\n|\n|\r)/gm, "~").split("~")
	var notesList = document.getElementById("notes-input").value.replace(/(\r\n|\n|\r)/gm, "~").split("~")
	var needsMoreInfo = document.getElementById("needs-more-info-input").checked
	
	//add recipe to json file
	var jsonFile = {};
	jsonFile[IDName] = {};
	jsonFile[IDName]["displayName"] = displayName;
	jsonFile[IDName]["totalTime"] = totalTime;
	jsonFile[IDName]["effortTime"] = effortTime;
	jsonFile[IDName]["type"] = type;
	jsonFile[IDName]["parent"] = "recipes";
	jsonFile[IDName]["ethnicity"] = ethnicity;
	jsonFile[IDName]["difficulty"] = difficulty;
	jsonFile[IDName]["defaultServings"] = servings;
	jsonFile[IDName]["directions"] = directionsList;
	jsonFile[IDName]["cookersNotes"] = notesList;
	jsonFile[IDName]["needsMoreInfo"] = needsMoreInfo;

	jsonFile[IDName]["ingredients"] = {};
	for(var ingredient of ingredientContainer.children){
		//if there is a sub list of ingredients
		if(ingredient.classList.contains("sub-ingredient-container")){
			var ingredientSubList = {};
			ingredientSubList[ingredient.children[0].value] = {};
			jsonFile[IDName]["ingredients"][ingredient.children[0].value] = {};
			//loop through sub ingredients
			for(var subIngredient of ingredient.children){
				if(subIngredient.classList.contains("sub-ingredient")){
					//get ingredient name
					var ingredientName = subIngredient.querySelector("[ingredient-input]").value;
					var ingredientID = ingredientName.toLowerCase().replaceAll(" ", "");
					
					//if it doesnt exist, make it
					if(!(ingredientID in ingredients)){
						httpNewIngredient(ingredientName, theUrl, function(response){
							console.log("Received: ", response);
						});
					}

					//add to recipe json
					var ingredientInfo = {};
					ingredientInfo["unit"] = subIngredient.querySelector("[unit-input]").value.toLowerCase().replaceAll(" ", "")
					ingredientInfo["amount"] = subIngredient.querySelector("[amount-input]").value.toLowerCase().replaceAll(" ", "")
					jsonFile[IDName]["ingredients"][ingredient.children[0].value][ingredientID] = ingredientInfo;
				}
			}
		}
		else{
			var ingredientName = ingredient.querySelector("[ingredient-input]").value;
			var ingredientID = ingredientName.toLowerCase().replaceAll(" ", "");

			//if it doesnt exist, make it
			if(!(ingredientID in ingredients)){
				httpNewIngredient(ingredientName, theUrl, function(response){
					console.log("Received: ", response);
				});
			}

			//add to recipe json
			var ingredientInfo = {};
			ingredientInfo["unit"] = ingredient.querySelector("[unit-input]").value.toLowerCase().replaceAll(" ", "")
			ingredientInfo["amount"] = ingredient.querySelector("[amount-input]").value.toLowerCase().replaceAll(" ", "")
			jsonFile[IDName]["ingredients"][ingredientID] = ingredientInfo;
		}
	}

	//send the json file
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
	xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify(jsonFile));
    
	// Set an event listener for when the request state changes
    xmlHttp.onreadystatechange = function() {
        // Check if the request is complete and successful
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            // Call the callback function with the response text
            callback(xmlHttp.responseText);
		}
    }
}

function submitInfo(goToHome = true){
	document.getElementById("loading-container").style.display = "inline-block";
	if(document.getElementById("name-input").value != ""){
		httpGetAsync(urlToSendTo, function(response) {
			// Log the received response
			console.log("Received: ", response);
			if(goToHome){
				window.location.href = "/recipe/" + document.getElementById("name-input").value.toLowerCase().replaceAll(" ", "");
			}
			setTimeout(() => {document.getElementById("loading-container").style.display = "none";}, 400);
		});
	}
}

function checkIngredient(inputField){
	const newIngredientIndicator = inputField.parentElement.querySelector('p');

        // Find the paragraph within the same <li> (assuming there's only one paragraph)
	if(inputField.value.toLowerCase().replaceAll(" ", "") in ingredients){
		newIngredientIndicator.className = "new-ingredient-indicator-hidden"
	}
	else{
		newIngredientIndicator.className = "new-ingredient-indicator"
	}
}

function goToHome(){
	window.location.href = "/";
}

function editRecipe(recipeID){
	getJsonData(recipeID, function(data){
		setValues(data);
	});
}

async function loadLists(){
	//set ingredient list
	let file = await fetch("/jsonInfo/ingredients.json")
	ingredients = await file.json()

	for(var ingredient of Object.keys(ingredients)){
		var option = document.createElement('option');
		option.value = ingredients[ingredient]["displayName"];
		ingredientDataList.appendChild(option);
	}
}

async function getJsonData(id, callback) {
	let file = await fetch("/jsonInfo/recipes.json")
	let recipes = await file.json()
	callback(recipes[id]);
}

function setValues(data){
	document.getElementById("name-input").value = data["displayName"];
	document.getElementById("total-time-input").value = data["totalTime"];
	document.getElementById("effort-time-input").value = data["effortTime"];
	document.getElementById("type-input").value = data["type"];
	document.getElementById("ethnicity-input").value = data["ethnicity"]
	document.getElementById("difficulty-input").value = data["difficulty"]
	document.getElementById("servings-input").value = data["defaultServings"]
	fillTextboxWithList(data["directions"], "directions-input");
	fillTextboxWithList(data["cookersNotes"], "notes-input");
	document.getElementById("needs-more-info-input").checked = data["needsMoreInfo"];

	for(var ingredient = 0; ingredient < Object.keys(data["ingredients"]).length; ingredient++){
		const ingredientInfo = data["ingredients"][Object.keys(data["ingredients"])[ingredient]];
		if(ingredientInfo["unit"] != null && ingredientInfo["amount"] != null){
			const container = addIngredient();
			container.querySelector("[ingredient-input]").value = ingredients[Object.keys(data["ingredients"])[ingredient]]["displayName"];
			container.querySelector("[amount-input]").value = ingredientInfo["amount"];
			container.querySelector("[unit-input]").value = ingredientInfo["unit"];
			checkIngredient(container.querySelector("[ingredient-input]"));
		}
		else{
			//add sublist
			const card = ingredientParentTemplate.content.cloneNode(true).children[0];
			ingredientContainer.append(card);
			card.children[0].value = Object.keys(data["ingredients"])[ingredient]
			//add sublist ingredients
			for(var subIngredient = 0; subIngredient < Object.keys(ingredientInfo).length; subIngredient++){
				const container = addSubIngredient();
				container.querySelector("[ingredient-input]").value = ingredients[Object.keys(ingredientInfo)[subIngredient]]["displayName"];
				container.querySelector("[amount-input]").value = ingredientInfo[Object.keys(ingredientInfo)[subIngredient]]["amount"];
				container.querySelector("[unit-input]").value = ingredientInfo[Object.keys(ingredientInfo)[subIngredient]]["unit"];
				checkIngredient(container.querySelector("[ingredient-input]"));
			}
		}
	}
}

function fillTextboxWithList(objectList, elementID){
	for(var objectID = 0; objectID < objectList.length; objectID++){
		document.getElementById(elementID).value += objectList[objectID];
		if(objectID != objectList.length - 1){
			document.getElementById(elementID).value += "\n"
		}
	}
}

function addIngredient(){
    const card = ingredientTemplate.content.cloneNode(true).children[0];
    ingredientContainer.append(card);
	return card;
}

function removeIngredient(){
	if(ingredientContainer.children.length > 0){
		const lastItem = ingredientContainer.children[ingredientContainer.children.length - 1];
		console.log(ingredientContainer.children.length);
		if(lastItem.classList.contains('sub-ingredient-container')){
			if(lastItem.children.length == 1){
				lastItem.remove();
			}
			else{
				//console.log(lastItem.children[lastItem.children.length - 1]);
				lastItem.children[lastItem.children.length - 1].remove();
			}
		}
		else{
			lastItem.remove();
		}
	}
}

function addSubIngredient(){
	if(!ingredientContainer.children[ingredientContainer.children.length - 1].classList.contains('sub-ingredient-container')){
		const card = ingredientParentTemplate.content.cloneNode(true).children[0];
		ingredientContainer.append(card);
	}
	const card = ingredientTemplate.content.cloneNode(true).children[0];
	card.classList.add('sub-ingredient');
	ingredientContainer.children[ingredientContainer.children.length - 1].append(card);
	return card;
}

function addSublist(){
    const card = ingredientParentTemplate.content.cloneNode(true).children[0];
    ingredientContainer.append(card);
	addSubIngredient();
}