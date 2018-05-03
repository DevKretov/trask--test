
// In your first script file
var AKFormCreator = {

    formFromStorage: false,
    formJSONObject: {},
    FORM_TITLE_KEY: 'title',
    FORM_DESCRIPTION_KEY: 'description',
    FORM_ID_KEY: 'id',
    FORM_SCHEMA_KEY: '$schema',
    FORM_ALLOF_KEY: 'allOf',
    FORM_ANYOF_KEY: 'anyOf',
    FORM_ONEOF_KEY: 'oneOf',

    requirements : {
        formValidationMode: '', // allOf, anyOf or oneOf - marker for validating input
        definitionNames: [] // list of definitions
    },

    jsonObjectToValidate: {},
    inputFieldsWithDefaultValues: {},



    NO_ID_ERROR_MESSAGE: 'Sorry, but this JSON scheme is invalid: id property missing!',
    JSON_REF_STRING: '$ref',


    formTitle: '',
    formDescription: '',
    formId: '',

    newDiv: {},

    requiredFieldObject: {},

    processJSONStringRecursive: function(JSONStringToProcess, depth = 0) {
        console.log('\n\nInside processJSON function\n\n');
        for(let block in JSONStringToProcess) {
            if (!JSONStringToProcess.hasOwnProperty(block)) {
                continue;
            }
            let val = JSONStringToProcess[block];
            if (typeof(val) === 'object' && block !== 'type') {
                // console.log("Found new inner object. Key = " + block + ', value = ' + JSONStringToProcess[block]);
                if (block === requirements.formValidationMode) {
                    console.log('Found block with requirements. Processing it...');
                    this.processRequirements(JSONStringToProcess[block], JSONStringToProcess);
                    console.log('\n\n');
                    continue;
                }

                if (block === 'properties' && depth === 0) {
                    console.log('Properties found!');
                    for(let property in JSONStringToProcess[block]) {

                        if(JSONStringToProcess.hasOwnProperty('required') &&
                            this.isThisFieldMarkedAsRequired(JSONStringToProcess['required'], property)) {
                            console.log('Property ' + property + ' is in required block');
                            requiredFieldObject[property] = true;
                        }

                        console.log(property);
                        switch(property) {
                            case 'version':
                                this.createNewHiddenField(property, '1');
                                break;
                            default:
                                console.log('WARNING! Property with name ' + property + ' does not have default value!');
                                break;
                        }

                    }

                    console.log('End properties\n\n');
                }

                // console.log('Found new key ' + block + ', its type is ' + typeof block + ', its val is ' + typeof(val));
                this.processJSONStringRecursive(val, depth + 1);
            } else {
                console.log('Found new key ' + block + ', value = <' + JSONStringToProcess[block] + '>, its type is ' + typeof block);
            }

        }
    },

    formObject: function(JSONString) {
        //JSONString = document.getElementById('json-textarea').value;
        //document.getElementById('JSONInputWindow').style.display = 'none';
        //document.getElementById('JSONInputResultWindow').style.display = 'block';
        formJSONObject = JSON.parse(JSON.stringify(JSONString));
      //  console.log(formJSONObject.attri);

        JSONString = JSON.parse(JSONString[FORM_SCHEMA_KEY]);

        console.log('formJSONObject = ' + formJSONObject);
        console.log('JSONString = ' + JSON.stringify(formJSONObject));

        newDiv = document.createElement('div');
        let newSpan = document.createElement('span');
        newSpan.className = 'contact100-form-title';
        newSpan.innerHTML = JSONString.hasOwnProperty('title') ? JSONString['title'] : 'New Trask form';
        newDiv.appendChild(newSpan);
        //newDiv.appendChild(createNewElement('p', JSONString));

        //processJSONInitialValues(JSONString);
        this.processFormTitleAndId(JSONString);
        this.setPropertiesValidation(JSONString);
        this.processJSONStringRecursive(JSONString, 0);


        /*  let submitButton = document.createElement('button');
          submitButton.className = 'contact100-form-btn';
          // submitButton.type = 'submit';
          submitButton.value = 'Submit form';
          submitButton.innerHTML = 'Submit form';
          submitButton.onclick = onSubmitButtonClick;

          newDiv.appendChild(submitButton); */

        // document.getElementById(formName).appendChild(newDiv);

        return newDiv;
    },

    createNewHiddenField: function(fieldName, value) {
        var element = document.createElement('input');
        element.setAttribute('required', 'true');
        element.setAttribute("type", "hidden");
        element.className = fieldName;
        element.id = fieldName;

        element.value = value;
        newDiv.appendChild(element);
    },

    createNewField: function(jsonObj, fieldName, required = false) {
        console.log('createNewField was invoked');
        let innerDiv = document.createElement('div');
        console.log('Inside createNewField function: ' + jsonObj + ', fieldName = ' + fieldName);

        var span = document.createElement('span');
        span.className = 'label-input100';
        span.innerHTML = jsonObj['title'] + ':';
        if(required) {
            // language=HTML
            span.innerHTML += '<span style="color: red;">' + ' *' + '</span>';
        }
        span.setAttribute('htmlFor', fieldName);

        var element = null;

        if(jsonObj.hasOwnProperty('enum')) {
            console.log('Creating selector...');
            //It's a selector
            element = document.createElement('select');
            element.id = fieldName;

            if(jsonObj.hasOwnProperty('default')) var selected = jsonObj['default'];

            for(var optionValue in jsonObj['enum']) {

                console.log('optionValue = ' + jsonObj['enum'][optionValue]);
                var option = document.createElement('option');
                option.value = option.text = jsonObj['enum'][optionValue];
                if(typeof selected !== 'undefined' && selected === option.value) option.selected = true;
                if(jsonObj.hasOwnProperty(fieldName) && option.value === jsonObj[fieldName].value)  option.selected = true;
                element.appendChild(option);
            }

        } else {
            element = document.createElement('input');
            if(required) element.setAttribute('required', 'true');
            else console.log('The element with name ' + fieldName + ' is not required!');
            element.className = 'input100';
            switch(jsonObj['type']) {
                case 'string':
                    element.setAttribute('type', 'text');
                    break;
                case 'number':
                    element.setAttribute('type', 'number');
                    break;
                case 'boolean':
                    element.setAttribute('type', 'checkbox');
                    break;
                /*case 'url':
                case 'link':
                    element.setAttribute('type', 'url');
                    break;
                case 'pick':
                case 'select':
                    element.setAttribute('type', 'checkbox');
                    break;
                case 'password':
                    element.setAttribute('type', 'password');
                    break; */
            }

            element.setAttribute('placeholder', jsonObj['description']);
            // element.addEventListener('blur',function(e){
            //    validateInputFieldOnBlur(e.target);});


            if(jsonObj.hasOwnProperty('default')) element.value = jsonObj['default'];
            else if(inputFieldsWithDefaultValues.hasOwnProperty(fieldName)) element.value = inputFieldsWithDefaultValues[fieldName];
            console.log('for field name ' + fieldName + ' element.value = ' + element.value);

            if(formJSONObject.hasOwnProperty(fieldName)) {
                element.value = formJSONObject[fieldName];
                //console.log('ERROR! formJSONObject[fieldName] = ' + formJSONObject[fieldName]);
            }
            //else console.log('ERROR! formJSONObject is ' + JSON.stringify(formJSONObject));

            console.log('1 ERROR! formJSONObject is ' + JSON.stringify(formJSONObject));

        }

        element.setAttribute('name', fieldName);
        element.setAttribute('id', fieldName);
        element.setAttribute('readonly', 'true');

        innerDiv.className = 'wrap-input100 validate-input';
        innerDiv.appendChild(span);
        innerDiv.appendChild(element);

        newDiv.appendChild(innerDiv);

        console.log('Created new input field with name ' + fieldName);

    },



    processFormTitleAndId: function(JSONString) {
        if(JSONString.hasOwnProperty(FORM_TITLE_KEY)) formTitle = JSONString[FORM_TITLE_KEY];
        if(JSONString.hasOwnProperty(FORM_DESCRIPTION_KEY)) formDescription = JSONString[FORM_DESCRIPTION_KEY];
       // if(JSONString.hasOwnProperty(FORM_ID_KEY)) formId = JSONString[FORM_ID_KEY];
        //else throw NO_ID_ERROR_MESSAGE;
    },

    setPropertiesValidation: function(JSONString) {
        if(JSONString.hasOwnProperty(FORM_ANYOF_KEY)) requirements.formValidationMode = FORM_ANYOF_KEY;
        else if(JSONString.hasOwnProperty(FORM_ALLOF_KEY)) requirements.formValidationMode = FORM_ALLOF_KEY;
        else if(JSONString.hasOwnProperty(FORM_ONEOF_KEY)) requirements.formValidationMode = FORM_ONEOF_KEY;
        else requirements.formValidationMode = 'none';
    },


// Go through allOf || oneOf || anyOf block and determine all definitions
    processRequirements: function(requirementsBlock, JSONString) {
        for(let i = 0; i < requirementsBlock.length; i++) {
            for(let block in requirementsBlock[i]) {
                if(block === JSON_REF_STRING) {
                    console.log('This requirement is in definition.');
                    if(requirementsBlock[i][block].charAt(0) === '#') {
                        let string = requirementsBlock[i][block].split('/');
                        console.log('Definition name is ' + string[string.length - 1]);
                        // If this definition is in this file ...
                        if(JSONString.hasOwnProperty('definitions') &&
                            JSONString['definitions'].hasOwnProperty(string[string.length - 1])) {
                            // we can process properties, additionalProperties, required field
                            let definitionRoot = JSONString['definitions'][string[string.length - 1]];
                            for(let field in definitionRoot['properties']) {
                                console.log('Creating new field with name ' + field + '...');

                                // In this block we set the default values list for our inputs
                                if(definitionRoot.hasOwnProperty('default')) {
                                    let defaultValue = definitionRoot['default'][field];


                                    if (defaultValue !== undefined) {
                                        // console.log('\nDEFAULT value is found for field ' + field + ', it is ' + defaultValue);
                                        inputFieldsWithDefaultValues[field] = defaultValue;
                                        // console.log(inputFieldsWithDefaultValues[field]);
                                    }
                                }

                                // In this block we set the list of required fields for further validation
                                if(definitionRoot.hasOwnProperty('required') &&
                                    this.isThisFieldMarkedAsRequired(definitionRoot['required'], field)) {

                                    requiredFieldObject[field] = true;

                                    this.createNewField(definitionRoot['properties'][field], field, true);
                                } else {
                                    this.createNewField(definitionRoot['properties'][field], field);

                                    requiredFieldObject[field] = false;
                                }
                            }
                        }
                        requirements.definitionNames.push([string[string.length - 1]]);
                        // The definition is in the same file. Mark in definitions array...
                    } else {
                        console.log('Cannot process this definition, because it is on the external server');
                    }
                }
                console.log('New requirement with value ' + requirementsBlock[i][block]);
            }

        }
    },

    isThisFieldMarkedAsRequired: function(requiredBlock, fieldName) {
        console.log('\nInside required function. fieldName = ' + fieldName);
        for(let field in requiredBlock) {
            // console.log(')
            if(requiredBlock[field] === fieldName) return true;
        }

        return false;
    }


};
