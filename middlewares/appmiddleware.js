exports.reqLogger = function(req,res,next) {
	
	console.log('Time of request:',Date.now());
	
	console.log("Request url is ",req.originalUrl);
	
	next();

};