# Trask Test
## Made by Anton Kretov
### anton@kretov.cz, 2018

This is my implementation of the task I was given as a part of
my selection procedure at Trask Solutions.

Used technologies and frameworks: HTML, CSS, Javascript (+ JSON), NodeJS (Express.js).

The task itself sounds:
"You have to create an application that takes a JSON Schema as
input data and produces a form with input fields specified in 
this schema. After an user fills in all required data, the 
application has to save this form in JSON format so that this
JSON object can be validated by JSON validator. Then this app
has to display all saved forms with user data. Every change made
in this JSON schema has to display to the form."

You can find the example of such a JSON schema following the link:
http://kretov.cz/trask/trasktest1.json

------------------

What I have done looks like this:

![Application's first window](http://kretov.cz/trask/img/ak_tt_first_window.png)

A user has to paste his JSON schema to the text area in the first
window and press Submit window. If this schema can be processed by my application,
you will see it in the second window:

![Application's second window](http://kretov.cz/trask/img/ak_tt_second_window.png)

All the input field specified in JSON schema file you have to see here. If something
goes wrong, please let me know.

![Application's second window](http://kretov.cz/trask/img/ak_tt_second_window_filled.png)

The field becomes green as soon as you have passed the basic validation (filled in
the data into the required field = didn't left the required field empty). If not,
the input field with the required attribute (it's marked with asterisk) becomes
red.

If everything is OK, click the "Submit button" and you will see the following:

![Application's second window](http://kretov.cz/trask/img/ak_tt_second_window_success.png)

The next step is to have a look at what we have saved. Frontend:

![Application's second window](http://kretov.cz/trask/img/ak_tt_third_window.png)

It is again a newly generated form, but all input fields are read-only (so that 
the whole form is read-only). In this page you will see all the forms you
successfully saved before.

Let's take a look at the backend of this saved form:

```javascript
{
    "$schema": "{\"$schema\":\"http://json-schema.org/draft-06/schema#\",\"id\":\"https://traskweb.azurewebsites.net/trasktest1.json\",\"type\":\"object\",\"title\":\"Trask Test 1 Schema\",\"additionalProperties\":true,\"allOf\":[{\"$ref\":\"#/definitions/TraskTest1\"}],\"properties\":{\"version\":{\"type\":\"string\",\"description\":\"Schema version that this trask test 1 requires.\"}},\"required\":[\"version\"],\"definitions\":{\"TraskTest1\":{\"additionalProperties\":true,\"type\":\"object\",\"description\":\"Schema for a trask test 1\",\"properties\":{\"email\":{\"type\":\"string\",\"title\":\"Email address\",\"description\":\"Your email adress\"},\"firstName\":{\"type\":\"string\",\"title\":\"First name\",\"description\":\"Your first name\"},\"lastName\":{\"type\":\"string\",\"title\":\"Last name\",\"description\":\"Your last name\"},\"company\":{\"type\":\"string\",\"title\":\"Company\",\"description\":\"Which company are you from?\"},\"position\":{\"type\":\"string\",\"title\":\"Work position\",\"description\":\"What position do you work?\"},\"source\":{\"type\":\"string\",\"title\":\"Source\",\"description\":\"Where did you hear about us?\"}},\"required\":[\"email\",\"firstName\",\"lastName\",\"company\",\"source\"]}}}",
    "version": "1",
    "email": "anton@kretov.cz",
    "firstName": "Anton",
    "lastName": "Kretov",
    "company": "Trask Solutions",
    "position": "Chatbot puppeteer",
    "source": "The universe"
}
``` 

So, it's indeed JSON and this JSON passes validation, so that all the data that
come from the form are correct.

Note: I pass the whole schema object as the "$schema" key's value in order to
effectively reconstruct the whole thing on user's demand. Despite the fact that
it increases the whole size of .json file, it comes up with a better and more convenient
method of regenerating the form.

#### Features:
1. You can specify as many input fields with various properties as you wish. Just follow JSON schema standards
and everything will be fine:<br>
    1.1. Define each input field inside "properties" block of your definition.<br>
    1.2. Inside the "properties" block specify the name of the input field.<br>
    1.3. Inside your input field's name block you MUST add "type" property (allowed are
    "string" (for text values), "number" (for digital input), "boolean" (for creating
    a checkbox)).
    1.4. Provide a caption for your input field by specifying a "title" property.
    1.5. Optional: if you want to provide a hint to an input field, specify a "description"
    property.
    1.6. If you wish to create a select input field, specify an "enum" property
    like this: ```"enum": ["value_1"", "value_2", ..., "value_n"]``` 
    1.7. If your input field has to be read-only, give this property:
    ```"readOnly": true"``` 
    
    Possible example could be:
    ```json
    "hobby": {
              "type":"string",
              "title": "Hobby",
              "description": "Where did you hear about us?",
              "enum": ["windrafting", "football", "hockey"]
            }
     ```
     
     In real life:
     
     ![Application's second window](http://kretov.cz/trask/img/ak_tt_select_example.png)

2. You can specify default values for every form. You can do it by creating "default"
property in your definition root. Example:
    ```json
    "default": {
       "hobby": "hockey", 
       "source": true, 
       "company": "Trask", 
       "firstName": "Anton", 
       "lastName": "Kretov", 
       "email": "anton@kretov.cz"
    }
    ```
    Simply make a list of key-values, where a key is the name of the input field and
    its value is its default value.
    
3. Evidently you can specify required fields by "required" property. Example:
    ```json
    "required": [
         "email",
         "firstName",
         "lastName",
         "hobby"
       ]
    ```
    Technically speaking, you simply have to make an array of fields' names that you
    have to be validated.
    
4. You can make use of JSON definitions. It increases your flexibility and you
can reuse your schemas without any problems. Inspire with the example provided in
the link above to know more.

#### Project structure

The project consists of two major parts: my code and ... not my code. Mine is in
'app.js' (server-side implementation), 'public/index.html' (the application's UI template),
'public/javascripts/ak_json_form_generator.js' (the core of the whole projects: all
handlers, listeners, constants, settings and validators).

"Not my code" is the rest. They're all the source files from Colorlib.com, where I
found such a great UI for the form (so that you don't need to put a mixer in your
eyes when you see it). The complete link is: https://colorlib.com/wp/free-html5-contact-form-templates/

'package.json' file is needed for this project, because I use NodeJS for simple
server implementation (for handling GET and POST queries).

#### TODO

Handle different validation modes (allOf/anyOf/oneOf). At the moment the whole
application works basing on the 'allOf' method.

#### Personal impression and feedback

I am glad that I had such a task, because I had to recall my Javascript knowledge
and learn new frameworks (NodeJS) to accomplish this task. Moreover, I solved one
more real-life problem and as a programmer became more qualified.

Time spent on this task: 15 hours. The most significant part of the application
(that I had to implement) took me about 5 hours + time to learn NodeJS. Other
10 hours were dedicated to small pitfalls, testing, adding more features, styling,
polishing, code refactoring, drinking tea and bear, googling and reading StackOverflow.
One additional hour was spent on writing this file (trying to convert my thoughts
in Czech and Russian languages into something that seems to be English :)).

Hope you'll make use of this application and even improve it. Thanks for your
attention and comments on all the bugs you find (they're hidden somewhere where I
cannot find them). :)

Cheers,
Anton Kretov 