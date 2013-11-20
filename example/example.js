$(function(){

	var myFirstForm = new Majo.Form( '#idForm', { 
	  '#login' 			: { 
			validate 	: 'required email',
			events 		: { 'keyup' : onKeyHandler }
		},
	  '#password'		: { 
			validate 	: 'required min',
			events 		: { 'blur' : onBlurHandler },
			min 		: 6
		},
	  '#password2' : { 
			validate 	: 'required min connected',
			connected	: '#password',
			events 		: { 'blur' : onBlurHandler },
			min 		: 6
		},
	  '#checkbox' 		: { 
			validate 	: 'checked',
			events 		: { 'change' : onChangeHandler } 
		},
	  '#checkbox2'		: { 
			validate 	: 'checked',
			events 		: { 'change' : onChangeHandler } 
		},
	  '[name="opt"]' : { 
	  	validate 	: 'radio', 
	  	events 		: { 'change' : onChangeHandler } 
		}
	});

    function onBlurHandler( event, errors ){
    	console.log('[onBlurHandler]', event.target, errors)
    }
    function onKeyHandler( event, errors ){
    	console.log('[onKeyHandler]', event.target, errors)
    }
    function onChangeHandler( event, errors ){
    	console.log('[onChangeHandler]', event.target, errors)
    }

	var myOtherForm = new Majo.Form('#idForm2', { 

	  '#login' : { validate 	: 'required username' }
	});

	$('#idForm').submit( function( event ){
		event.preventDefault();
		var result = myFirstForm.isValid( function( errors ){
			console.log( 'myFirstForm', errors.length, errors);
		});
		console.log("Result's validation --> " + result);
	});

	$('#idForm2').submit( function( event ){
		event.preventDefault();
		myOtherForm.isValid( function( errors ){
			console.log( 'myOtherForm', errors.length, errors);
		});
	});

});
