(function(){

	// Save a reference to the global object (`window` in the browser, `exports`
	// on the server).
	var root = this;

	// The top-level namespace. All public iValidate classes and modules will
	// be attached to this. Exported for both the browser and the server.
	// Create a safe reference to the Underscore object for use below.
	var Majo = {};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = Majo;
		}
		exports.Majo = Majo;
	} else {
		root.Majo = Majo;
	}

	var Form = Majo.Form = function( _idForm, _validatorsConfig ){

		var $mainForm = $(_idForm);
		var processedValidators = {};

		updateFormItems( _validatorsConfig );

		// Update form validators
		function updateFormItems( validators ){

			// Get a collections of Validators
			for( var formItemConfig in validators ){ 

				// formItemConfig --> { "input.email" : "email required"}
				//                       -----------     --------------
				//                        DOM Elem    :  type1 type2 ... 

				var DOMElemValidations 	= ( $.type( validators[ formItemConfig ] ) === 'string' ) ? validators[ formItemConfig ] : validators[ formItemConfig ].validate ,
					ElemEvents 			= ( validators[ formItemConfig ].events ) ? validators[ formItemConfig ].events : null ,
					typeCollection 		= DOMElemValidations.split(' ');

				typeCollection.forEach( function( _type ) {
					
					if( !processedValidators[ formItemConfig ] ) processedValidators[ formItemConfig ] = [];
					
					processedValidators[ formItemConfig ].push({ 
						'el' 	: $mainForm.find( formItemConfig ),
						'name' 	: formItemConfig,
						'run' 	: new Validator( _type, formItemConfig, validators[ formItemConfig ] ),
						'type' 	: (validators[ formItemConfig ][_type]) ? (_type +'.'+ validators[ formItemConfig ][_type]) : _type
					}); 
				});

				if( ElemEvents ){
					//console.log( 'ElemEvents', ElemEvents, formItemConfig );
					
					for( _event in ElemEvents ){
						
						var _origCallback = ElemEvents[ _event ];
						
						ElemEvents[ _event ] = function( __origCallback, __formItemConfig ){
							
							// return precompiled function
							// to wrap the original callback and the formItem
							return function( event ){
								var errors = [];
								var _fItem = __formItemConfig;
								
								processSingleValid( _fItem , function( isValid ){
									if( !isValid ){
										// errors : {'input.user' : ["max30", ...] }
										errors.push( this.type );
									}
								});

								__origCallback.apply( this, [ event, errors ] );	
							}

						}( _origCallback, formItemConfig );

						$(formItemConfig).on( ElemEvents );
					}
				}
			}

			//console.log( 'processedValidators', processedValidators );
		}
	  
		function objectToArray( obj ){
			var _arr = [];
			for( var o in obj ){
				_xObj = {};
				_xObj[ o ] = obj [ o ];
				_arr.push( _xObj );
			}
			return _arr;
		}

		function processSingleValid( _validator , _callback ){
			var validator = processedValidators[ _validator ];
			$( validator ).each( function(){ 
			
				var formValue = ( this.el.attr('type') === 'checkbox' || this.el.attr('type') === 'radio') ? this.el.prop('checked') : this.el.val();
				var isValid = this.run( formValue ).isValid();
			
				_callback.apply( this, [isValid] );
			
			});
		}
	  
		return {
			
			isValid: function( _onComplete ){
				
				var errors = {};

				for ( _validator in processedValidators ) {
					processSingleValid( _validator , function( isValid ){
						if( !isValid ){
							// errors : {'input.user' : ["max30", ...] }
							if( !errors[ this.name ] ) errors[ this.name ] = [];
							errors[ this.name ].push( this.type );
						}
					});
				};

				_onComplete.apply(this, [ objectToArray( errors ) ]);

				return ( !objectToArray( errors ).length ) ? true : false;
			}
		};
	}

	function Validator( _factory, _elem, _validatorItem ){
	  var validators = {
	    username  : new regExpValidator( /^[/\w ]{3,32}$/ ),
		email     : new regExpValidator( /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/ ),
		url       : new regExpValidator( /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/ ),
		password  : new regExpValidator( /^(?=^.{6,}$)((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.*$/ ),
		ip        : new regExpValidator( /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ ),
	    hex       : new regExpValidator( /^#?([a-f0-9]{6}|[a-f0-9]{3})$/ ),
	    checked   : new regExpValidator( true ),
		radio     : new radioValidator( _elem ),
		required  : new regExpValidator( /[^ ]{1,}/ ),
		connected 	: new connectValidator( _elem , _validatorItem.connected), 
		min 	: new minValidator( _elem , _validatorItem.min),
		max 	: new maxValidator( _elem , _validatorItem.max) 
	  };
	  
	  return validators[_factory];
	}

	function regExpValidator( _regExp ) {
		var _regexp =  _regExp;
		
		return function( _test ){
			return {
				isValid: function(){
					return new RegExp(_regexp).test( _test );
				}
			}
		}
	}

	function radioValidator( _elem ) {
		
		var elem =  _elem;
		
		return function( _value ){
			return {
				isValid: function(){
					
					var __isValid = false;
					
					$(elem).each( function( ){
						if( $(this).prop('checked') ){
							__isValid = true;
							return;
						}
					});
					
					return ( __isValid ) ? true : false;
				}
			}
		}
	}

	function connectValidator( _elem, _elemConnected ){
		var elem =  _elem,
			elemConnected = _elemConnected;
		
		return function( _value ){
			return {
				isValid: function(){
					return _value === $(elemConnected).val();
				}
			}
		}
	}

	function minValidator( _elem, _chars ){
		var elem =  _elem,
			chars = _chars;
		
		return function( _value ){
			return {
				isValid: function(){
					return new regExpValidator( "[^ ]{"+chars+",}" )( _value ).isValid();
				}
			}
		}
	}

	function maxValidator( _elem, _chars ){
		var elem =  _elem,
			chars = _chars;
		
		return function( _value ){
			return {
				isValid: function(){
					return new regExpValidator( "^.{0,"+chars+"}$" )( _value ).isValid();
				}
			}
		}
	}

	//console.log( Majo );

}).call(this);
