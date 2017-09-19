//import the mongoose module
var mongoose = require('mongoose');

//define a schema
var Schema = mongoose.Schema;

var blogSchema = new Schema({

	title 		: {type:String,default:'',required:true},
	
	subTitle	: {type:String,default:''},
	
	blogBody	: {type:String,default:''},
	
	authorInfo	: {},
	
	created		: {type:Date},
	
	lastModified: {type:Date},
	
	imageUrl	: {type:String,default:''},
	
	tags		: [],
	
	comments    : [],
	
	likes       : [],
	
	shares      : []

});

// compile model from schema
mongoose.model('Blog',blogSchema);