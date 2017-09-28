//include the Express Module in the application
var express = require('express');
var app = express();
//include the middleware Body-Parser in the application
var bodyParser = require('body-parser');
//include the middleware Express-Validator in the application
var expressValidator = require('express-validator');
//include the mongoose module
var mongoose = require('mongoose');
//include the application middleware to log the time of post, put or delete request
var middleWares = require('./middlewares/appmiddleware.js');
//include the response generator library
var responseGenerator = require('./libs/responseGenerator.js');

app.use(bodyParser.json({limit:'10mb',extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
// Add this after the bodyParser middlewares!
app.use(expressValidator());

mongoose.Promise = global.Promise;
//define the configuration of the database
var dbPath = "mongodb://localhost/myblogdata";
db = mongoose.connect(dbPath);

//check the connection is open or not
mongoose.connection.once('open',function() {
	console.log("database connection open success");
});
//check if there is some error in connecting with the database
mongoose.connection.once('error',function(err) {
	console.log("Error connecting with database");
});

//include the model file
var Blog = require('./blogModel.js');
//now we can perform various functions on this database using blogmodel
var blogModel = mongoose.model('Blog');

//API to View All Blogs
app.get('/blogs',function(req,res){
	
	blogModel.find({},function(err,result) {
		
		if (err) {
			console.log(err);
			res.send(err);
		}

		else {
			var myResponse = responseGenerator.generate(null,"Successfully Fetched all Results",200,result);
			res.send(myResponse);
	    }

	});

});//end get all blogs

//API to Create a Blog
app.post('/blogs/create',middleWares.reqLogger, function(req,res) {

	//check that the title is not empty
	req.checkBody('title','Please Enter the Title').notEmpty();
 	//check that image url is in proper format
 	(req.body.imageUrl == undefined || req.body.imageUrl == null)?'':req.checkBody('imageUrl','Enter Valid URL for the Image').isURL();
	
	var errors = req.validationErrors();

 	if (errors) {
		//show the errors made by the client in entering fields while making post request
	 	var myResponse = responseGenerator.generate(true,"Bad Request. Check the Entries that you have supplied",400,null);
	 	myResponse.errors = [];

		errors.forEach(function(err) {
			myResponse.errors.push(err.msg);
		});

		res.statusCode = 400;
		return res.send(myResponse);
	}

 	else {
 		var newBlog = new blogModel({
			title       : req.body.title,
			subTitle 	: req.body.subTitle,
			blogBody	: req.body.blogBody,
			imageUrl	: req.body.imageUrl,
			authorName  : req.body.authorName
		});//end newBlog

		var today = Date.now();
		newBlog.created = today;
		newBlog.lastModified = today;
		var allTags = (req.body.tags!=undefined && req.body.tags!=null)?req.body.tags.split(','):'';
		newBlog.tags = allTags;
		var allLikes = (req.body.likes!=undefined && req.body.likes!=null)?req.body.likes.split(','):'';
		newBlog.likes = allLikes;
		var allShares = (req.body.shares!=undefined && req.body.shares!=null)?req.body.shares.split(','):'';
		newBlog.shares = allShares;
		var allComments = (req.body.comments!=undefined && req.body.comments!=null)?req.body.comments.split(','):'';
		newBlog.comments = allComments;

		//save the blog in the database
		newBlog.save(function(error) {
			
			if(error) {
				console.log(error);
				var myResponse = responseGenerator.generate(true,"Some error- "+err,500,null);
				res.send(myResponse);
			}
		
			else {
				res.statusCode = 200;
				var myResponse = responseGenerator.generate(null,"Successfully Created New Blog",200,newBlog);
			    res.send(myResponse);
			}
	
		});//end new blog save	
	
	}

});//end create blog

//API to get a particular blog based on ID 
app.get('/blogs/:id',function(req,res) {
	
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
  	//Yes, it's a valid ObjectId, proceed with `findById` call.
		blogModel.findById(req.params.id, function(err,result) {
			
			if(err) {
				console.log(err);
				res.send(err);
			}

			else {
				//if given id is false, then show 404 error
				if (result === null) {
					res.statusCode = 404;
					var myResponse = responseGenerator.generate(true,"Not Found. Check the Id you supplied",404,null);
					res.send(myResponse);
				}
				
				else {
					res.statusCode = 200;
					var myResponse = responseGenerator.generate(null,"Successfully Fetched Result",200,result);
					res.send(myResponse);
				}
			}

		});
	
	}

	else {
		res.statusCode = 404;
		var myResponse = responseGenerator.generate(true,"Not Found. Check the Id you supplied",404,null);
	    res.send(myResponse);
	}
	
});//end get particular blog

//API to Edit the Blog
app.put('/blogs/:id/edit',middleWares.reqLogger,function(req,res) {

	(req.body.title == undefined || req.body.title == null)?'':req.checkBody('title','Please Enter the Title').notEmpty();
 	(req.body.imageUrl == undefined || req.body.imageUrl == null)?'':req.checkBody('imageUrl','Enter Valid URL for the Image').isURL();
	
	var errors = req.validationErrors();
	if (errors) {
		//show the errors made by the client in entering fields while making put request
		var myResponse = responseGenerator.generate(true,"Bad Request. Check the Entries that you have supplied",400,null);
	 	myResponse.errors = [];

	 	errors.forEach(function(err) {
	       myResponse.errors.push(err.msg);
	    });

	    res.statusCode = 400;
	    return res.send(myResponse);
	}

 	else {
		//update the lastModified field of the blog
		req.body.lastModified = Date.now();
		var update = req.body;
		//Yes, it's a valid ObjectId, proceed with `findById` call.
		if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {

			blogModel.findOneAndUpdate({'_id':req.params.id},update,{new: true},function(err,result) {
				
				if(err) {
					console.log("some error");
					res.send(err);
				}
				
				else {
					//if given id is false, then show 404 error
					if (result === null) {
						res.statusCode = 404;
						var myResponse = responseGenerator.generate(true,"Not Found. Check the Id you supplied",404,null);
	    				res.send(myResponse);						
					}
					
					else {
						res.statusCode = 200;
						var myResponse = responseGenerator.generate(null,"Successfully Updated the Blog",200,result);
						res.send(myResponse);
					}
				}

			});
	
		}
		
		else {
			res.statusCode = 404;
			var myResponse = responseGenerator.generate(true,"Not Found. Check the Id you supplied",404,null);
			res.send(myResponse);
		}

	}

});//end edit blog

//API to delete the Blog
app.post('/blogs/:id/delete',middleWares.reqLogger,function(req,res) {

	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
	
		blogModel.remove({'_id':req.params.id},function(err,result) {
		
			if(err) {
				console.log(err);
				res.send(err);
			}
		
			else {
				
				if (result.result.n === 0) {
					res.statusCode = 404;
					var myResponse = responseGenerator.generate(true,"Not Found. Check the Id you supplied",404,null);
					res.send(myResponse);
				}
		
				else {
					res.statusCode = 200;
					var myResponse = responseGenerator.generate(null,"Successfully Deleted the Blog",200,result);
					res.send(myResponse);
				}
			
			}

		});
	}

	else {
		res.statusCode = 404;
		var myResponse = responseGenerator.generate(true,"Not Found. Check the Id you supplied",404,null);
		res.send(myResponse);
	}

});

//Any other route than the defined routes will be handled by these middlewares

app.get('*',function(req,res,next){

	res.statusCode = 404;
	next("Path not found");
	
});

app.post('*',function(req,res,next){

	res.statusCode = 404;
	next("Path not found");
	
});

app.put('*',function(req,res,next){

	res.statusCode = 404;
	next("Path not found");
	
});

//error handling middleware
app.use(function(err,req,res,next) {

	console.log("this is error handling middleware");
	
	if(res.statusCode==404) {
		var myResponse = responseGenerator.generate(true,"404. Page Not Found Error. Sorry, the page you were looking for cannot be found",404,null);
		res.send(myResponse);
	}
	
	else {
		console.log(err);
		res.send(err);
	}

});

app.listen(3000,function() {
	console.log('Example app listening on port 3000!');
});