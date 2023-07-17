"user strict";

document.addEventListener("DOMContentLoaded", () => {
    // Container elements
    const elPlatformSelect = document.querySelector('#platformForm');
    const elCompareForm = document.querySelector("#comparisonForm");
    const elResultContainer = document.querySelector('#resultContainer');
    const elResultTable = document.querySelector('#missingItemsList');
    
    // Controls
    const propertyInput = document.querySelector('#property');
    const lbPlatformInput = document.querySelector('#lbPlatformFile')
    const platformSelect = document.querySelector("#platformSelect");
    const platformInput = document.querySelector('#platformFile');
    const metadataInput = document.querySelector('#metadataFile');
    
    // Message fields
    const msglbPlatformFile = document.querySelector("#msglbPlatformFile");
    const msgPlatformSelect = document.querySelector("#msgPlatformSelect");

    // Startup defaults
    lbPlatformInput.focus();

    // XML property to use to query against
    // TODO: Add option to select different field?
    propertyInput.defaultValue = "DatabaseID";

    // Reset form when new Launchbox Platform.xml file is selected
    lbPlatformInput.addEventListener("change", resetForms);

    // Verify platform selection was changed from default
    platformSelect.addEventListener("change", checkSelect);


    // Eventlistener for Launchbox Platform.xml file submission
    document.querySelector("#lbPlatformFileForm").addEventListener('submit', function(e) {
        e.preventDefault();
        resetForms();

        // Get Launchbox platform file
        let lbPlatformFile = lbPlatformInput.files[0];
        
        // Read in Platform.xml file
        let reader = new FileReader();
        reader.onload = function(e) { 
            let xml = e.target.result;            

            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(xml, 'text/xml');

            // Validate file is Platform.xml
            if(xmlDoc.firstChild.tagName == "LaunchBox" && xmlDoc.firstChild.firstElementChild.tagName == "Platform"){

                let platformsXml = xmlDoc.getElementsByTagName('Platform');
                let arrPlatform = [];
                for(let i = 0; i < platformsXml.length; i++){
    
                    arrPlatform[i] = platformsXml[i].firstElementChild.textContent;
    
                }
                
                // Sort and remove dups from new Platform array then add to Select
                arrPlatform.sort();
                arrPlatform = [...new Set(arrPlatform)];
                arrPlatform.forEach(platformOptions);
    
                
                // Add Platforms to platformSelect
                function platformOptions(item){
                    platformSelect.options.add( new Option(item,item));
                }

                // Setup next section
                elPlatformSelect.style.display = 'block';
                msglbPlatformFile.innerHTML = "OK";
                msglbPlatformFile.classList.add("ok");
                msglbPlatformFile.classList.remove("error");

            } else {
                // Error on Platforms.xml file selection
                msglbPlatformFile.innerHTML = "Please select a Launchbox Platforms.xml file.";
                msglbPlatformFile.classList.add("error");
                msglbPlatformFile.classList.remove("ok");
            }            
        };
        // Reader Init
        reader.readAsText(lbPlatformFile);      

    });

    // Eventlistener for comparison file submission
    // TODO: Add loading spinner
    document.querySelector('#comparisonForm').addEventListener('submit', function(e) {
        e.preventDefault();
    
        // Get Launchbox Metadata.xml and user platform file
        let metadataFile = metadataInput.files[0];
        let platformFile = platformInput.files[0];
        
        // XML property to query against -> DEFAULT is set to 'DatabaseID'
        let property = propertyInput.value;

        // Promise to query metadata and platform files; Returns missing games to display
        const getPlatformMetadata = (metadataFile, platformFile) => new Promise((resolve, reject) => {
            
            // Reader for metadataFile
            let reader1 = new FileReader();
            reader1.onload = (e) => {
                let xml1 = e.target.result;
    
                let parser = new DOMParser();
                let xmlDoc1 = parser.parseFromString(xml1, 'text/xml');
    
                // Create an array to store the values
                const valuesArray = [];
    
                // Validate file is Metadata.xml
                if(xmlDoc1.firstChild.tagName == "LaunchBox" && xmlDoc1.firstChild.firstElementChild.tagName == "Game"){
                    const xpathQuery = `//Game[Platform='${platformSelect.value}']`;
                    const matchingItems = xmlDoc1.evaluate(xpathQuery, xmlDoc1, null, XPathResult.ANY_TYPE, null);                
    
                    // Iterate over the matching items and extract the values
                    let item = matchingItems.iterateNext();
                    while (item) {
                        let newItem = {};
                        newItem.title = item.querySelector('Name').textContent;
                        newItem.databaseID = item.querySelector('DatabaseID').textContent;

                        // Pushing platform compare data to array
                        valuesArray.push(newItem);
                        item = matchingItems.iterateNext();
                    }    
                }
        
                // Reader for platformFile
                let reader2 = new FileReader();
                reader2.onload = function(e) {
                    let xml2 = e.target.result;
                    let xmlDoc2 = parser.parseFromString(xml2, 'text/xml');
                    let items2 = xmlDoc2.getElementsByTagName('Game');
        
                    // Array to hold missing games
                    let missingItems = [];
        
                    // Looping to compare metadata and platform files looking for missing games
                    for (let i = 0; i < valuesArray.length - 1; i++) {
                        if(valuesArray[i].databaseID){

                            // Load game DatabaseID 
                            let propertyValue = valuesArray[i].databaseID;
                            
                            let found = false;
                            for (let j = 0; j < items2.length; j++) {
                                if(items2[j].getElementsByTagName(property)[0]){
                                    // If user game is found, flag it TRUE and break out of loop
                                    if (items2[j].getElementsByTagName(property)[0].textContent === propertyValue) {
                                        found = true;
                                        break;
                                    }
                                }                                
                            }
                            
                            // If game not found, add to missingItems array
                            if (!found) {
                                let missingItem = {};
                                missingItem.databaseID = propertyValue;
                                missingItem.title = valuesArray[i].title;
                                missingItems.push(missingItem);
                            }
                        }                        
                    }

                    // Promise return of the missing games
                    resolve(missingItems);
                };

                // Reader2 Error and Init
                reader2.onerror = function(e){
                    reject(e);
                }
                reader2.readAsText(platformFile);
            };

            // Reader1 Error and Init
            reader1.onerror = function(e){
                reject(e);
            }
            reader1.readAsText(metadataFile);
        });

        // Calls Promise to query compare files and DisplayResults
        getPlatformMetadata(metadataFile, platformFile).then((result) => displayResult(result));
    
        
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

    // Function to display results from comparing user platform file and metadata
    function displayResult(missingItems) {

        if(elResultTable.innerHTML != ''){
            // Remove eventlisteners for 
            let tableTRs = document.querySelectorAll('#missingItemsList tr')
            tableTRs.forEach((tr) =>{
                tr.removeEventListener("mouseover", (e) =>{
                    let tableTR = e.target.parentElement;
                    tableTR.classList.add('active-row');
                });
                tr.removeEventListener("mouseout", (e) =>{
                    let tableTR = e.target.parentElement;
                    tableTR.classList.remove('active-row');
                });
            });   
        }

        // Reset table
        elResultTable.innerHTML = '';
    
        // Validation to confirm data
        if (missingItems.length === 0) {
            elResultTable.innerHTML = '<tr><td>No missing items found.</td></tr>';
        } else {
            // Create table headers
            let header = elResultTable.createTHead();
            let hRow = header.insertRow(0);
            let cell1 = hRow.insertCell(0);
            let cell2 = hRow.insertCell(1);
            cell1.innerHTML = "Title";
            cell2.innerHTML = "DatabaseID";
            let tBody = elResultTable.createTBody();
    
            // Loop over missing games to display in table
            for (let i = 0; i < missingItems.length; i++) {
                let row = tBody.insertRow(i);
                let cellTitle = row.insertCell(0);
                let cellId = row.insertCell(1);
                cellTitle.innerHTML = missingItems[i].title;
                cellId.innerHTML = missingItems[i].databaseID;
    
            }

            // Add eventlisteners for 
            let tableTRs = document.querySelectorAll('#missingItemsList tr')
            tableTRs.forEach((tr) =>{
                tr.addEventListener("mouseover", (e) =>{
                    let tableTR = e.target.parentElement;
                    tableTR.classList.add('active-row');
                });
                tr.addEventListener("mouseout", (e) =>{
                    let tableTR = e.target.parentElement;
                    tableTR.classList.remove('active-row');
                });
            });            
        }

        // Reveal table when Compare is clicked
        elResultContainer.style.display = 'block';
    }
});






