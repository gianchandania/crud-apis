//include the Express Module in the application
var express = require('express');

var app = express();

//include the middleware Body-Parser in the application
var bodyParser = require('body-parser');

//include the middleware Express-Validator in the application
var expressValidator = require('express-validator');

//include the mongoose module
var mongoose = require('mongoose');

app.use(bodyParser.json({limit:'10mb',extended:true}));

app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));

// Add this after the bodyParser middlewares!
app.use(expressValidator()); 

//include the application middleware to log the time of post, put or delete request
var middleWares = require('./appmiddleware.js');

mongoose.Promise = global.Promise;
//define the configuration of the database
var dbPath = "mongodb://localhost/myblogdata";

db = mongoose.connect(dbPath);

//check the connection is open or not
mongoose.connection.once('open',function() {
	
	console.log("database connection open success");

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
	
			res.json({"error": null, "message": "Success", "userMessage": "Successfully Fetched all Results", "status": 200, "data": result});
	
		}
	
	});

});

//API to Create a Blog
app.post('/blogs/create',middleWares.reqLogger, function(req,res) {

	//check that the title is not empty
	req.checkBody('title','Please Enter the Title').notEmpty();
 	
 	//check that the email is in proper format
 	(req.body.authorEmail == undefined || req.body.authorEmail == null)?'':req.checkBody('authorEmail','Enter Valid Email Address').isEmail();
 	
 	//check that image url is in proper format
 	(req.body.imageUrl == undefined || req.body.imageUrl == null)?'':req.checkBody('imageUrl','Enter Valid URL for the Image').isURL();
	
	var errors = req.validationErrors();

 	if (errors) {
		
		//show the errors made by the client in entering fields while making post request
	 	var response = { "error": "true", "message": "Bad Request", "userMessage": "Check the Entries that you have supplied", "status": 400, errors: [], "data": null };
	
	 	errors.forEach(function(err) {
	
	      response.errors.push(err.msg);
	
	    });
	
	    res.statusCode = 400;
	
	   	return res.json(response);
	
	}

 	else {

 		var newBlog = new blogModel({

			title       : req.body.title,
	
			subTitle 	: req.body.subTitle,
		
			blogBody	: req.body.blogBody,
			
			imageUrl	: req.body.imageUrl
		
		});//end newBlog

 		var today = Date.now();
		
		newBlog.created = today;
		
		newBlog.lastModified = today;

		var authorInfo = {fullName:req.body.authorFullName,email:req.body.authorEmail};
		
		newBlog.authorInfo = authorInfo;

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
				
				res.send(error);
			}
		
			else {

				res.statusCode = 200;
			
				res.json({"error": null, "message": "Success", "userMessage": "Successfully Created New Blog", "status": 200,"data": newBlog});
			
			}
	
		});//end new blog save	
	
	}

});

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

					res.json({"error": "true", "message": "Not Found", "userMessage": "Check the Id you supplied", "status": 404, "data": null});
		
				}
				
				else {

					res.statusCode = 200;

					res.json({"error": null, "message": "Success", "userMessage": "Successfully Fetched Result", "status": 200, "data": result});
				}
			}

		});
	
	}

	else {

		res.statusCode = 404;
	
		res.json({"error": "true", "message": "Not Found", "userMessage": "Check the Id you supplied", "status": 404, "data": null});
	
	}
	
});

//API to Edit the Blog
app.put('/blogs/:id/edit',middleWares.reqLogger,function(req,res) {

	(req.body.title == undefined || req.body.title == null)?'':req.checkBody('title','Please Enter the Title').notEmpty();
 	
 	(req.body.imageUrl == undefined || req.body.imageUrl == null)?'':req.checkBody('imageUrl','Enter Valid URL for the Image').isURL();
	
	var errors = req.validationErrors();

 	if (errors) {
		
		//show the errors made by the client in entering fields while making put request
	 	var response = { "error": "true", "message": "False Entry", "userMessage": "Check the Entries that you have supplied", "status": 400, errors: [], "data": null };
	 	
		errors.forEach(function(err) {
	      
	      response.errors.push(err.msg);
	    
	    });
	    
	    res.statusCode = 400;
	    
	    return res.json(response);
	 
	}

 	else {

 		//update the lastModified field of the blog
		req.body.lastModified = Date.now();
	
		var update = req.body;

		console.log(req.body.authorEmail);

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
					
						res.json({"error": "true", "message": "Not Found", "userMessage": "Check the Id you supplied", "status": 404, "data": null});
		
					}
					
					else {

						res.statusCode = 200;
					
						res.json({"error": null, "message": "Success", "userMessage": "Successfully Updated the Blog", "status": 200, "data": result});
					
					}
				
				}

			});
	
		}
		
		else {

			res.statusCode = 404;
		
			res.json({"error": "true", "message": "Not Found", "userMessage": "Check the Id you supplied", "status": 404, "data": null});
		
		}

	}

});

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

					res.json({"error": "true", "message": "Not Found", "userMessage": "Check the Id you supplied", "status": 404, "data": null});
		
				}
		
				else {

					res.statusCode = 200;
					
					res.json({"error": null, "message": "Success", "userMessage": "Successfully Deleted the Blog", "status": 200, "data": result});
			
				}
			
			}

		});
	}

	else {
	
		res.statusCode = 404;
		
		res.json({"error": "true", "message": "Not Found", "userMessage": "Check the Id you supplied", "status": 404, "data": null});
	
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
		
		res.send("404. Page Not Found Error. Sorry, the page you were looking for cannot be found");
	
	}
	
	else {
		
		console.log(err);
		
		res.send(err);
	
	}

});

app.listen(3000,function() {

	console.log('Example app listening on port 3000!');

});