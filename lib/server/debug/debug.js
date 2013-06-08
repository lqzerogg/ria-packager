var path = require('path');
var fs = require('fs');
var debug = {};

function outputJS(req, res){
	var outer;
	  // <script src="json2.js"></script>
   //  <script src="jquery.min.js"></script>
   //  <script src="jquery.jsoneditor.js"></script>
   //  <script src="jsoneditor_new.js"></script>
	outer = fs.readFileSync(path.join(__dirname, 'json2.js'), 'utf8');
	outer = outer + fs.readFileSync(path.join(__dirname, 'jquery.min.js'), 'utf8');
	outer = outer + fs.readFileSync(path.join(__dirname, 'jquery.jsoneditor.js'), 'utf8');
	outer = outer + fs.readFileSync(path.join(__dirname, 'jsoneditor.js'), 'utf8');
	return outer;
}

function outputCSS(req, res){
	return fs.readFileSync(path.join(__dirname, 'jsoneditor.css'), 'utf8');
}

function outputHTML(req, res){
	return fs.readFileSync(path.join(__dirname, 'debug.html'), 'utf8');
}

debug.outputHTML = outputHTML;
debug.outputCSS = outputCSS;
debug.outputJS = outputJS;

module.exports = debug;
