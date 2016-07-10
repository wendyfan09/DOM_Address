function bindDOM(element, model){

	var keys_values = {};

	//apply getters and setters
	for(var key in model){

		keys_values[key] = model[key];  //get the specific value from each key

		(function(key_name){
			Object.defineProperty(
				model, key_name, {
				set: function(value){
					this["_"+key_name] = value;
					if(this.hasOwnProperty("_render")){
						this._render(key_name);
					}
				}
			});
			Object.defineProperty(
				model, key_name, {
				get: function(){
					return this["_"+key_name];
				}
			});
		})(key);

	}

	//re apply values
	for(var key in keys_values){
		model[key] = keys_values[key];
	}

	//parse templates
	model._parseTemplates = function(){

		for(var key in this){

			if(key[0] === '_' || typeof(this[key]) === 'function'){
				continue;  //boundary case check
			}

			$(element).each(function(){

				var findQuery = '{{[\\s]*'+key+'[\\s]*([\|\\w_\\s]*)*}}';
				findQuery = new RegExp(findQuery, 'g');

				replaceClass = 'property-'+key;

				var inner = $(this).html();
				$(this).html(inner.replace(
					findQuery,
					function(match, formatters){

						if(typeof(formatters) === 'undefined'){
							return '<span class="'+replaceClass+'"></span>';
						}

						//parse formatters
						if(formatters[0] === '|'){
							formatters = formatters.substring(1);
						}
						formatters = formatters.replace(/ /g,''); //remove whitespace
						formatters = formatters.split('|');

						return '<span class="'+replaceClass+'" data-formatters="'+formatters.join(",")+'"></span>';
					}
				));
			});
		}
	};
	model._parseTemplates();


	//render method
	model._render = function(changed_key){

		var new_value = this[changed_key];

		//text nodes 
		$(element+' .property-'+changed_key).each(function(){
			var formatters = $(this).attr('data-formatters');

			if(typeof(formatters) === 'undefined' || formatters === false){
				return $(this).text(new_value);
			}

			//Manage the formatters specifically to the model for the <h2>
			formatters = formatters.split(',');
			var loops = formatters.length;
			var formatted_value = new_value;
			var i, formatter;
			for(i = 0; i < loops; i++){

				formatter = formatters[i];

				if(model.hasOwnProperty(formatter)){
					formatted_value = model[formatter](formatted_value);
				}else if(window.hasOwnProperty(formatter)){
					formatted_value = window[formatter](formatted_value);
				}

			};

			return $(this).text(formatted_value);
		});

		//input type text
		$(element+' input[type="text"][data-property-bind="'+changed_key+'"]').val(new_value);

		//input type number
		$(element+' input[type="number"][data-property-bind="'+changed_key+'"]').val(new_value);

	};

	//render all values
	for(var key in keys_values){
		model._render(key);
	}

	//two-way data-binding
	model._bindInputs = function(){

		var self = this;

		for(var key in model){

			if(key[0] === '_' || typeof(this[key]) === 'function'){
				continue;
			}

			(function(property){
				$(element+' input[data-property-bind="'+property+'"]').on('input change', function(){
					var type = $(this).attr('type');

					self[property] = $(this).val();
				});
			})(key);

		}

	};
	model._bindInputs();

}