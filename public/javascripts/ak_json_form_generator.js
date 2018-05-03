/**
*   Trask test 1
*   Made by Anton Kretov,
*   anton@kretov.cz, 2018
*
*   This program takes index.html file and produces 3 windows that can be switched by tabs in the upper part of the browser screen
*   In the first window you have to put your JSON schema for creating the form. You can find an example of such a schema in the link below:
*   http://kretov.cz/trask/schema.json
*
*   This application is able to create an arbitrary number of input fields. You can freely specify its types (allowed ones are:
*   "string", "boolean", "number"). If you want to create a select field, specify "enum" property of the input field (its type will be "string"))
*
*   You can also specify default values by providing "default" property. If you want to mark your input field as required, you have to specify
*   this property ("required": true). It's recommended to specify default and required properties as a list of pairs (key - value), where
*   the key is the name of the input field and the value is the value you have to specify. If your field is not required, do not include it in
*   the "required" field.
*
*   You can also make use of definitions as you can see it from the link above. However, at the moment there is no mechanism to work with anyOf or oneOf
*   modes. If you don't know what it is, see: https://spacetelescope.github.io/understanding-json-schema/basics.html
*
*   If you have some problems with using this application, feel free to contact me at my email.
*
*   Hope that my application will help you and you'll find it a good solution to your projects.
*
*/



// The next three constants are the ids of three windows for this application
const JSON_INPUT_WINDOW_ID = 'JSONInputWindow';
const GENERATED_FORM_WINDOW_ID = 'JSONInputResultWindow';
const SAVED_FORMS_WINDOW_ID = 'JSONSavedFormsWindow';


const JSON_SCHEMA_INPUT_TEXTAREA_ID = 'json-textarea';          // The id of textarea where the JSON schema has to be
const GENERATED_FORM_FORM_ID = 'final-form';                    // The id of the generated form in the second window
const SAVED_FORMS_CONTAINER_ID = 'all-forms-root';
const SUBMIT_JSON_SCHEMA_BUTTON_ID = 'submit-json-schema-button';

const JSON_INPUT_WINDOW_TAB_ID = 'json-input-window-button';
const GENERATED_FORM_WINDOW_TAB_ID = 'generated-form-window-button';
const SAVED_FORMS_WINDOW_TAB_ID = 'saved-forms-window-button';

const FORM_VALIDATION_URL = '/process_form';                    // The URL of backend form handler
const SAVED_FORMS_URL = '/saved_forms';                    // The URL of backend form handler
const SERVER_PORT = '10101';


const FORM_ALLOF_KEY = 'allOf';
const FORM_ANYOF_KEY = 'anyOf';
const FORM_ONEOF_KEY = 'oneOf';
const JSON_REF_STRING = '$ref';

const INPUT_FIELD_VALIDATION_FAILED_COLOR = '#ffc9c9';
const INPUT_FIELD_VALIDATION_PASSED_COLOR = '#c9ffc9';

const THANKS_FOR_SUBMITTING_FORM_MESSAGE = 'Thanks for submitting form! It is saved and you can take a look at it by clicking "See list of forms" button!';
const NO_CREATED_FORM_MESSAGE = 'There is no form yet. Click "Upload JSON Schema" to create new form from JSON schema';
const NO_SAVED_FORMS_MESSAGE = 'There are no forms saved yet! Proceed to "Upload JSON schema" please.';
const HTTP_ERROR_MESSAGE = 'Sorry, but your form was not sent to server due to some technical problems. Contact the application administrator!';

const FORM_DEFAULT_TITLE = 'Trask form';

//TODO - Distinguish between different validation modes (not developed yet)
let requirements = {
    formValidationMode: '', // allOf, anyOf or oneOf - marker for validating input
    definitionNames: [] // list of definitions
};


let formJSONObjectToValidate = {};                      // Here we place all the information that we send to server
let inputFieldsWithDefaultValues = {};                  // This object works as a hash table: you can get field's (key) default value (value)
let formInnerDiv = null;                                // This object is inside the form, here we put input field with its label
let requiredInputFields = {};                           // Pseudo hash table with field's name (key) and true (as key)

let formFromStorageJSONObject = {};                     // Here we put the whole saved JSON form with all data

if (window.addEventListener) { // Mozilla, Netscape, Firefox
    window.addEventListener('load', onWindowLoad, false);
} else if (window.attachEvent) { // IE
    window.attachEvent('onload', onWindowLoad);
}

// DO NOT TOUCH IT! This function set all the listeners and prepares the whole application
function onWindowLoad() {

    // Display the first window
    setWindowsDisplayMode('block', 'none', 'none');
    document.getElementById(GENERATED_FORM_FORM_ID).appendChild(getMessageSpan(NO_CREATED_FORM_MESSAGE));
    document.getElementById(SAVED_FORMS_CONTAINER_ID).appendChild(getMessageSpan(NO_SAVED_FORMS_MESSAGE));

    document.getElementById(JSON_INPUT_WINDOW_TAB_ID).onclick = function() {
        setWindowsDisplayMode('block', 'none', 'none');
    };

    document.getElementById(GENERATED_FORM_WINDOW_TAB_ID).onclick = function() {
        setWindowsDisplayMode('none', 'block', 'none');
    };

    document.getElementById(SUBMIT_JSON_SCHEMA_BUTTON_ID).onclick = onSubmitJSONButtonClick;
    document.getElementById(SAVED_FORMS_WINDOW_TAB_ID).onclick = onGetSavedFormsButtonClick;

}

function onSubmitJSONButtonClick() {
    resetVariablesAndObjects();

    let JSONSchemaString = JSON.parse(document.getElementById(JSON_SCHEMA_INPUT_TEXTAREA_ID).value);

    // Save the whole schema to the '$schema' property of the new object for the faster recovery when creating ths form from storage
    formJSONObjectToValidate['$schema'] = JSON.stringify(JSONSchemaString);
    setPropertiesValidationMode(JSONSchemaString);

    setWindowsDisplayMode('none', 'block', 'none');

    // The root container where all the form is stored
    formInnerDiv = document.createElement('div');
    formInnerDiv.appendChild(getFormTitleAndDescription(JSONSchemaString));

    processRootPropertiesIfExist(JSONSchemaString);

    processRequirementsAndCreateInputFields(JSONSchemaString);

    formInnerDiv.appendChild(getSubmitButton());

    document.getElementById(GENERATED_FORM_FORM_ID).innerHTML = '';
    document.getElementById(GENERATED_FORM_FORM_ID).appendChild(formInnerDiv);
}

function createFormFromStorage(JSONSchemaString) {
    resetVariablesAndObjects();

    formFromStorageJSONObject = JSONSchemaString;
    JSONSchemaString = JSON.parse(JSONSchemaString['$schema']);
    formInnerDiv = document.createElement('div');
    formInnerDiv.className = 'saved-form-div';
    formInnerDiv.appendChild(getFormTitleAndDescription(JSONSchemaString));

    //console.log(JSONSchemaString);
    setPropertiesValidationMode(JSONSchemaString);
    processRootPropertiesIfExist(JSONSchemaString);

    processRequirementsAndCreateInputFields(JSONSchemaString, true);
    document.getElementById(SAVED_FORMS_CONTAINER_ID).appendChild(formInnerDiv);

}

function resetVariablesAndObjects() {

    requirements = {
        formValidationMode: '',
        definitionNames: []
    };

    formJSONObjectToValidate = {};
    inputFieldsWithDefaultValues = {};

    requiredInputFields = {};
}

function onSubmitFormButtonClick() {
    let formInnerInputFields = document.forms[GENERATED_FORM_FORM_ID].elements;

    for(let i = 0; i < formInnerInputFields.length; i++) {
        //console.log('Found new input field with name ' + formInnerInputFields[i].id + '. Its value is ' + formInnerInputFields[i].value);

        if(formInnerInputFields[i].tagName === 'BUTTON') continue;

        if(!isThisInputFieldFilledCorrectly(formInnerInputFields[i])) {
            alert('Sorry, but this form cannot be submitted, because the field ' + formInnerInputFields[i].id +
                ' cannot be empty!');
            return;
        }

        //console.log('LOG ' + formInnerInputFields[i].tagName);
        if(formInnerInputFields[i].tagName === 'SELECT') {
            formJSONObjectToValidate[formInnerInputFields[i].id] = formInnerInputFields[i].options[formInnerInputFields[i].selectedIndex].value;
        } else {
            switch(formInnerInputFields[i].type) {
                case 'checkbox':
                    formJSONObjectToValidate[formInnerInputFields[i].id] = formInnerInputFields[i].checked;
                    break;
                case 'number':
                    /* if(isNaN(formInnerInputFields[i].value)) {
                        alert('Sorry, but there is not a number in the field ' + formInnerInputFields[i].className);
                        throw 'number parse error';
                    } */
                    formJSONObjectToValidate[formInnerInputFields[i].id] = parseInt(formInnerInputFields[i].value);
                    break;
                default:
                    formJSONObjectToValidate[formInnerInputFields[i].id] = formInnerInputFields[i].value;
                    break;
            }
        }
    }
    sendDataToServer();

    // This function has to return false if used for submitting form inside <form> tag for not letting HTML form submission mechanism work
    return false;
}

function sendDataToServer() {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', FORM_VALIDATION_URL);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) {
            let response = xmlhttp.responseText;
            if (xmlhttp.status === 200 || response.status === 'OK') {
                document.getElementById(GENERATED_FORM_FORM_ID).innerHTML = '';
                document.getElementById(GENERATED_FORM_FORM_ID).appendChild(getMessageSpan(THANKS_FOR_SUBMITTING_FORM_MESSAGE));
            } else {
                alert(HTTP_ERROR_MESSAGE);
            }
        }
    };

    xmlhttp.send(JSON.stringify(formJSONObjectToValidate));
}

// Create span with some message to put it to the center of the app's window
function getMessageSpan(message) {
    let span = document.createElement('span');
    span.className = 'contact100-form-title';
    span.style.textAlign = 'center';
    span.innerHTML = message;
    return span;
}

// Hidden input field are used to pass system information to the server
function createNewHiddenInputField(fieldName, value) {
    let hiddenInputField = document.createElement('input');
    hiddenInputField.setAttribute('required', 'true');
    hiddenInputField.setAttribute('type', 'hidden');
    hiddenInputField.className = hiddenInputField.id = fieldName;
    hiddenInputField.value = value;

    formInnerDiv.appendChild(hiddenInputField);
}

function createNewInputField(jsonInputFieldObject, inputFieldName, fromStorage = false) {
    let required = requiredInputFields.hasOwnProperty(inputFieldName) ? requiredInputFields[inputFieldName] : false;

    let divForInputFieldAndLabel = document.createElement('div');
    divForInputFieldAndLabel.className = 'wrap-input100 validate-input';

    let inputField = {};

    // If this field has 'enum' property, then we have to choose between several values, that we find in 'enum' key
    if(jsonInputFieldObject.hasOwnProperty('enum')) {
        // So we use selector instead of input field
        inputField = document.createElement('select');
        let selectedValue = null;

        if(fromStorage && formFromStorageJSONObject.hasOwnProperty(inputFieldName)) {
            selectedValue = formFromStorageJSONObject[inputFieldName];
        } else {
            if(jsonInputFieldObject.hasOwnProperty('default')) {
                selectedValue = jsonInputFieldObject['default'];
            } else if(inputFieldsWithDefaultValues.hasOwnProperty(inputFieldName)) {
                selectedValue = inputFieldsWithDefaultValues[inputFieldName];
            }
        }

        for(let optionValue in jsonInputFieldObject['enum']) {
            let option = document.createElement('option');
            option.value = option.text = jsonInputFieldObject['enum'][optionValue];

            if(selectedValue !== null && selectedValue === option.value)
                option.selected = true;

            inputField.appendChild(option);
        }

        if(fromStorage || (jsonInputFieldObject.hasOwnProperty('readOnly') && jsonInputFieldObject['readOnly'])) {
            inputField.setAttribute('disabled', 'true');
        }
    } else {
        inputField = document.createElement('input');
        inputField.className = 'input100';

        switch(jsonInputFieldObject['type']) {
            case 'string':
                inputField.setAttribute('type', 'text');
                break;
            case 'number':
                inputField.setAttribute('type', 'number');
                break;
            case 'boolean':
                inputField.setAttribute('type', 'checkbox');
                break;
        }

        // If this form is not from storage, then we do not need to give placeholder and provide validator
        if(!fromStorage) {
            inputField.setAttribute('placeholder', jsonInputFieldObject['description'] !== undefined ? jsonInputFieldObject['description'] : '');
            inputField.addEventListener('blur',function(e){
                validateInputFieldOnBlur(e.target);});
        }

        // If we generate a form from storage, we don't need default values
        if(fromStorage && formFromStorageJSONObject.hasOwnProperty(inputFieldName)) {
            if(inputField.type === 'checkbox' && formFromStorageJSONObject[inputFieldName]) {
                inputField.checked = true;
            } else {
                inputField.value = formFromStorageJSONObject[inputFieldName];
            }

        } else {
            if(jsonInputFieldObject.hasOwnProperty('default')) {
                inputField.value = jsonInputFieldObject['default'];
            } else if(inputField.type === 'checkbox' && inputFieldsWithDefaultValues.hasOwnProperty(inputFieldName)) {
                inputField.checked = true;
            } else if(inputFieldsWithDefaultValues.hasOwnProperty(inputFieldName)) {
                inputField.value = inputFieldsWithDefaultValues[inputFieldName];
            }
        }

        // Set input fields as readOnly if it's a form from storage or it is explicitly defined in JSON schema
        if(fromStorage || (jsonInputFieldObject.hasOwnProperty('readOnly') && jsonInputFieldObject['readOnly']))  {
            if(inputField.type === 'checkbox')
                inputField.setAttribute('disabled', 'true');
            else
                inputField.setAttribute('readonly', 'true');
        }

    }

    let inputFieldTitleSpan = document.createElement('span');
    inputFieldTitleSpan.className = 'label-input100';
    inputFieldTitleSpan.setAttribute('htmlFor', inputFieldName);

    // If somebody forgot to specify the name for the input field, use its id
    if(jsonInputFieldObject['title'] === undefined) jsonInputFieldObject['title'] = inputFieldName;
    inputFieldTitleSpan.innerHTML = jsonInputFieldObject['title'] + ':';

    // Add a glorious star to the input field title and make use of HTML5 validation
    if(required) {
        inputFieldTitleSpan.innerHTML += '<span style="color: red;">' + ' *' + '</span>';
        inputField.setAttribute('required', 'true');
    }

    divForInputFieldAndLabel.appendChild(inputFieldTitleSpan);

    inputField.setAttribute('name', inputFieldName);
    inputField.setAttribute('id', inputFieldName);
    divForInputFieldAndLabel.appendChild(inputField);

    // Don't forget to add the whole thing to the main form's container
    formInnerDiv.appendChild(divForInputFieldAndLabel);

}

function getSubmitButton() {
    let submitButton = document.createElement('button');
    submitButton.className = 'contact100-form-btn';
    submitButton.innerHTML = 'Submit form';
    submitButton.onclick = onSubmitFormButtonClick;
    return submitButton;
}

// This function has to select the mode for form validation
//TODO - develop different ways of validation (not only AllOf)
function setPropertiesValidationMode(JSONString) {
    if(JSONString.hasOwnProperty(FORM_ANYOF_KEY)) requirements.formValidationMode = FORM_ANYOF_KEY;
    else if(JSONString.hasOwnProperty(FORM_ALLOF_KEY)) requirements.formValidationMode = FORM_ALLOF_KEY;
    else if(JSONString.hasOwnProperty(FORM_ONEOF_KEY)) requirements.formValidationMode = FORM_ONEOF_KEY;
    else throw 'Validation type not specified!';
}

function setWindowsDisplayMode(firstWindowDisplayMode, secondWindowDisplayMode, thirdWindowDisplayMode) {
    document.getElementById(JSON_INPUT_WINDOW_ID).style.display = firstWindowDisplayMode;
    document.getElementById(GENERATED_FORM_WINDOW_ID).style.display = secondWindowDisplayMode;
    document.getElementById(SAVED_FORMS_WINDOW_ID).style.display = thirdWindowDisplayMode;
}

function getFormTitleAndDescription(JSONString) {
    let titleSpan = document.createElement('span');
    titleSpan.className = 'contact100-form-title';
    titleSpan.innerHTML = JSONString.hasOwnProperty('title') ? JSONString['title'] : FORM_DEFAULT_TITLE;

    if(JSONString.hasOwnProperty('description')) {
        let descriptionSpan = document.createElement('span');
        descriptionSpan.style.fontSize = '0.7em';
        descriptionSpan.innerHTML = '<br>' + JSONString['description'];
        titleSpan.appendChild(descriptionSpan);
    }

    return titleSpan;
}

function processRootPropertiesIfExist(JSONStringToProcess) {
    if(!JSONStringToProcess.hasOwnProperty('properties')) return;
    for(let property in JSONStringToProcess['properties']) {

        if(JSONStringToProcess.hasOwnProperty('required') &&
            isThisFieldMarkedAsRequired(JSONStringToProcess['required'], property)) {
            requiredInputFields[property] = true;
        }
        switch(property) {
            case 'version':
                createNewHiddenInputField(property, '1');
                break;
            default:
                console.log('WARNING! Property with name ' + property + ' does not have default value!');
                break;
        }
    }
}

//This is the main function of the whole program. Here we go through all the definitions presented in allOf/oneOf/anyOf block and create input fields
function processRequirementsAndCreateInputFields(JSONSchema, fromStorage = false) {
    // Go through allOf/oneOf/anyOf block and determine all definitions
    console.log(JSON.stringify(JSONSchema));
    for(let i = 0; i < JSONSchema[requirements.formValidationMode].length; i++) {
        for(let block in JSONSchema[requirements.formValidationMode][i]) {
            // If this block has a reference to some definition...
            if(block === JSON_REF_STRING) {
                let refString = JSONSchema[requirements.formValidationMode][i][block];

                // If the reference to the definition is in the same file...
                if(refString.charAt(0) === '#') {
                    if(!JSONSchema.hasOwnProperty('definitions')) continue;
                    refString = refString.split('/');
                    let definitionName = refString[refString.length - 1];

                    // If this definition is in this file ...
                    if(JSONSchema['definitions'].hasOwnProperty(definitionName)) {
                        // we can process properties, additionalProperties, required field
                        let definitionRoot = JSONSchema['definitions'][definitionName];
                        for(let field in definitionRoot['properties']) {

                            // Set the default value for the new input field if exists
                            if(!fromStorage && definitionRoot.hasOwnProperty('default') && definitionRoot['default'][field] !== undefined) {
                                inputFieldsWithDefaultValues[field] = definitionRoot['default'][field];
                            }

                            // If this input field is in 'required' list, add it in our list for further validation and create this input field
                            if(definitionRoot.hasOwnProperty('required') &&
                                isThisFieldMarkedAsRequired(definitionRoot['required'], field)) requiredInputFields[field] = true;

                            createNewInputField(definitionRoot['properties'][field], field, fromStorage);
                        }
                    }

                    // TODO Make use of this logic for handling anyOn/oneOf parameters
                    requirements.definitionNames.push(definitionName);
                } else {
                    console.log('Cannot process this definition, because it is on the external server');
                }
            }
        }

    }
}

// When input field loses focus, this function invokes
function validateInputFieldOnBlur(target) {
    if(!isThisInputFieldFilledCorrectly(target)) {
        target.style.background = INPUT_FIELD_VALIDATION_FAILED_COLOR;
    } else {
        target.style.background = INPUT_FIELD_VALIDATION_PASSED_COLOR;
    }
}


function isThisFieldMarkedAsRequired(requiredBlock, fieldName) {
    // Just a simple linear search (I know that I could do it in constant time, but it requires thinking in exponential time)
    for(let field in requiredBlock) {
        if(requiredBlock[field] === fieldName) return true;
    }
    return false;
}

/*
   * If this input field is in our array of input fields that are needed to be fulfilled
   * AND this field is required (true) AND it is not fulfilled or checked, then mark it red
   * Otherwise mark it green
*/
function isThisInputFieldFilledCorrectly(inputFieldToCheck) {
    return !((requiredInputFields.hasOwnProperty(inputFieldToCheck.id) &&
        (inputFieldToCheck.value === undefined || inputFieldToCheck.value === '' ||
            (inputFieldToCheck.type === 'checkbox' && !inputFieldToCheck.checked)
        )) || (inputFieldToCheck.type === 'number' && inputFieldToCheck.value === ''));
}

function onGetSavedFormsButtonClick() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            setWindowsDisplayMode('none', 'none', 'block');

            let jsonResponse = JSON.parse(xhr.responseText);
            console.log('jsonResponse = ' + JSON.stringify(jsonResponse));
            if(jsonResponse.length === 0) return;

            document.getElementById(SAVED_FORMS_CONTAINER_ID).innerHTML = '';
            for(let i = 0; i < jsonResponse.length; i++){

                createFormFromStorage(jsonResponse[i]);

                let frontierHTMLLine = document.createElement('hr');
                frontierHTMLLine.style.margin = '5rem 0rem';
                document.getElementById(SAVED_FORMS_CONTAINER_ID).appendChild(frontierHTMLLine);
            }
        }
    };

    xhr.open('GET', 'http://localhost:' + SERVER_PORT + SAVED_FORMS_URL, true);
    xhr.send(null);
}
