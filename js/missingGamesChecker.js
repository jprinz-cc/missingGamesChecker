

document.addEventListener("DOMContentLoaded", () => {
    const elProperty = document.querySelector('#property');
    const elPlatformForm = document.querySelector("#platformForm");
    const platformSelect = document.querySelector("#platformSelect");

    document.getElementById('file1').focus();
    elProperty.defaultValue = "DatabaseID";

    document.querySelector("#platformFileForm").addEventListener('submit', function(e) {
        e.preventDefault();
        elPlatformForm.style.display = 'block';
        let platformFile = document.querySelector("#platformFile").files[0];
        
        let reader1 = new FileReader();
        reader1.onload = function(e) { 
            let xml1 = e.target.result;            

            let parser = new DOMParser();
            let xmlDoc1 = parser.parseFromString(xml1, 'text/xml');
            let platformsXml = xmlDoc1.getElementsByTagName('Platform');
            let arrPlatform = [];
            for(let i = 0; i < platformsXml.length; i++){

                arrPlatform[i] = platformsXml[i].firstElementChild.textContent;

            }
            
            arrPlatform.sort();
            arrPlatform = [...new Set(arrPlatform)];
            arrPlatform.forEach(platformOptions);

            
            //platformSelect.options.length = arrPlatform.length;
            function platformOptions(item){
                console.log(item);
                platformSelect.options.add( new Option(item,item));
            }
        };
        reader1.readAsText(platformFile);      

    });

    document.querySelector("#platformForm").addEventListener('submit', function(e) {
        e.preventDefault();
    });

    document.getElementById('comparisonForm').addEventListener('submit', function(e) {
        e.preventDefault();
    
        let file1 = document.getElementById('file1').files[0];
        let file2 = document.getElementById('file2').files[0];
        let property = elProperty.value;
    
        let reader1 = new FileReader();
        reader1.onload = function(e) {
            let xml1 = e.target.result;
    
            let reader2 = new FileReader();
            reader2.onload = function(e) {
                let xml2 = e.target.result;
    
                let parser = new DOMParser();
                let xmlDoc1 = parser.parseFromString(xml1, 'text/xml');
                let xmlDoc2 = parser.parseFromString(xml2, 'text/xml');
    
                let items1 = xmlDoc1.getElementsByTagName('Game');
                let items2 = xmlDoc2.getElementsByTagName('Game');
    
                let missingItems = [];
    
                for (let i = 0; i < items1.length - 1; i++) {
                    if(items1[i].getElementsByTagName(property)[0]){
                        let propertyValue = items1[i].getElementsByTagName(property)[0].textContent;
    
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
                            missingItem.title = items1[i].getElementsByTagName("Title")[0].textContent;
                            missingItems.push(missingItem);
                        }
                    }
                    
                }
    
                displayResult(missingItems);
            };
    
            reader2.readAsText(file2);
        };
    
        reader1.readAsText(file1);
    });


});



function displayResult(missingItems) {
    let resultContainer = document.getElementById('resultContainer');
    let resultTable = document.getElementById('missingItemsList');

    resultTable.innerHTML = '';

    if (missingItems.length === 0) {
        resultTable.innerHTML = '<tr><td>No missing items found.</td></tr>';
    } else {
        let header = resultTable.createTHead();
        let hRow = header.insertRow(0);
        let cell1 = hRow.insertCell(0);
        let cell2 = hRow.insertCell(1);
        cell1.innerHTML = "Title";
        cell2.innerHTML = "DatabaseID";

        for (let i = 0; i < missingItems.length; i++) {
            let row = resultTable.insertRow(i+1);
            let cellTitle = row.insertCell(0);
            let cellId = row.insertCell(1);
            cellTitle.innerHTML = missingItems[i].title;
            cellId.innerHTML = missingItems[i].databaseID;

        }
    }

    resultContainer.style.display = 'block';
}