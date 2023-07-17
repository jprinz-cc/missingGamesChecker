

document.addEventListener("DOMContentLoaded", () => {
    // Container elements
    const elPlatformSelect = document.querySelector('#platformForm');
    const elCompareForm = document.querySelector("#comparisonForm");
    const elResultContainer = document.getElementById('resultContainer');
    const elResultTable = document.getElementById('missingItemsList');
    
    // Controls
    const propertyInput = document.querySelector('#property');
    const lbPlatformInput = document.querySelector('#lbPlatformFile')
    const platformSelect = document.querySelector("#platformSelect");
    const platformInput = document.getElementById('platformFile');
    const metadataInput = document.getElementById('metadataFile');
    
    // Message fields
    const msglbPlatformFile = document.querySelector("#msglbPlatformFile");
    const msgPlatformSelect = document.querySelector("#msgPlatformSelect");

    // Startup defaults
    lbPlatformInput.focus();
    propertyInput.defaultValue = "DatabaseID";

    // Reset form when new Launchbox Platform.xml file is selected
    lbPlatformInput.addEventListener("change", resetForms);

    // Verify platform selection was changed from default
    platformSelect.addEventListener("change", checkSelect);


    // Eventlistener for Launchbox Platform.xml file submission
    document.querySelector("#lbPlatformFileForm").addEventListener('submit', function(e) {
        e.preventDefault();
        resetForms();
        let lbPlatformFile = lbPlatformInput.files[0];
        
        let reader = new FileReader();
        reader.onload = function(e) { 
            let xml = e.target.result;            

            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(xml, 'text/xml');

            if(xmlDoc.firstChild.tagName == "LaunchBox" && xmlDoc.firstChild.firstElementChild.tagName == "Platform"){

                let platformsXml = xmlDoc.getElementsByTagName('Platform');
                let arrPlatform = [];
                for(let i = 0; i < platformsXml.length; i++){
    
                    arrPlatform[i] = platformsXml[i].firstElementChild.textContent;
    
                }
                
                arrPlatform.sort();
                arrPlatform = [...new Set(arrPlatform)];
                arrPlatform.forEach(platformOptions);
    
                
                //platformSelect.options.length = arrPlatform.length;
                function platformOptions(item){
                    //console.log(item);
                    platformSelect.options.add( new Option(item,item));
                }
                elPlatformSelect.style.display = 'block';
                msglbPlatformFile.innerHTML = "OK";
                msglbPlatformFile.classList.add("ok");
                msglbPlatformFile.classList.remove("error");

            } else {
                msglbPlatformFile.innerHTML = "Please select a Launchbox Platforms.xml file.";
                msglbPlatformFile.classList.add("error");
                msglbPlatformFile.classList.remove("ok");
            }            
        };
        reader.readAsText(lbPlatformFile);      

    });


    document.querySelector('#comparisonForm').addEventListener('submit', function(e) {
        e.preventDefault();
    
        let metadataFile = metadataInput.files[0];
        let platformFile = platformInput.files[0];
        let property = propertyInput.value;
    
        let reader1 = new FileReader();
        reader1.onload = function(e) {
            let xml1 = e.target.result;

            let parser = new DOMParser();
            let xmlDoc1 = parser.parseFromString(xml1, 'text/xml');

            // Create an array to store the values
            const valuesArray = [];

            if(xmlDoc1.firstChild.tagName == "LaunchBox" && xmlDoc1.firstChild.firstElementChild.tagName == "Game"){
                const xpathQuery = `//Game[Platform='${platformSelect.value}']`;
                const matchingItems = xmlDoc1.evaluate(xpathQuery, xmlDoc1, null, XPathResult.ANY_TYPE, null);                

                // Iterate over the matching items and extract the values
                let item = matchingItems.iterateNext();
                while (item) {
                    console.log("item: ", item);
                    //const value = item.querySelector('Platform').textContent;
                    let newItem = {};
                    newItem.title = item.querySelector('Name').textContent;
                    newItem.databaseID = item.querySelector('DatabaseID').textContent;
                    valuesArray.push(newItem);
                    item = matchingItems.iterateNext();
                }

                console.log(valuesArray);

            }
    
            let reader2 = new FileReader();
            reader2.onload = function(e) {
                let xml2 = e.target.result;
    
               
                let xmlDoc2 = parser.parseFromString(xml2, 'text/xml');
    
                //let items1 = xmlDoc1.getElementsByTagName('Game');
                let items2 = xmlDoc2.getElementsByTagName('Game');
    
                let missingItems = [];
    
                for (let i = 0; i < valuesArray.length - 1; i++) {
                    if(valuesArray[i].databaseID){
                        let propertyValue = valuesArray[i].databaseID;
    
                        let found = false;
                        for (let j = 0; j < items2.length; j++) {
                            if(items2[j].getElementsByTagName(property)[0]){
                                if (items2[j].getElementsByTagName(property)[0].textContent === propertyValue) {
                                    found = true;
                                    break;
                                }
                            }
                            
                        }
        
                        if (!found) {
                            let missingItem = {};
                            missingItem.databaseID = propertyValue;
                            missingItem.title = valuesArray[i].title;
                            missingItems.push(missingItem);
                        }
                    }
                    
                }
    
                displayResult(missingItems);
            };
    
            reader2.readAsText(platformFile);
        };
    
        reader1.readAsText(metadataFile);
    });

    // Reset form function
    function resetForms(){
        elPlatformSelect.style.display = 'none';
        elCompareForm.style.display = 'none';
        elResultContainer.style.display = 'none';
        msglbPlatformFile.innerHTML = "";
        msgPlatformSelect.innerHTML = "";
        platformSelect.selectedIndex = 0;
    }

    // Function to verify platform selection was changed from default
    function checkSelect(){
        if(platformSelect.value != ""){
            msgPlatformSelect.innerHTML = "OK";
            elCompareForm.style.display = 'block';
        } else {
            msgPlatformSelect.innerHTML = "";
            elCompareForm.style.display = 'none';
        }
    }

    function displayResult(missingItems) {

        elResultTable.innerHTML = '';
    
        if (missingItems.length === 0) {
            elResultTable.innerHTML = '<tr><td>No missing items found.</td></tr>';
        } else {
            let header = elResultTable.createTHead();
            let hRow = header.insertRow(0);
            let cell1 = hRow.insertCell(0);
            let cell2 = hRow.insertCell(1);
            cell1.innerHTML = "Title";
            cell2.innerHTML = "DatabaseID";
    
            for (let i = 0; i < missingItems.length; i++) {
                let row = elResultTable.insertRow(i+1);
                let cellTitle = row.insertCell(0);
                let cellId = row.insertCell(1);
                cellTitle.innerHTML = missingItems[i].title;
                cellId.innerHTML = missingItems[i].databaseID;
    
            }
        }
    
        elResultContainer.style.display = 'block';
    }
});






