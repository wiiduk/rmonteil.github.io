var http = require('http');
var fs = require("fs");

http.createServer(function (request, response) {
    if (/^\/[a-zA-Z0-9\/-]*.html$/.test(request.url.toString())) {
        fs.readFile("./src" + request.url.toString(), function (err, data) {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(data);
            response.end();
        });
    } else if (/^\/[a-zA-Z0-9\/-]*.js$/.test(request.url.toString())) {
        sendFileContent(response, "./src/" + request.url.toString().substring(1), "text/javascript");
    } else if (/^\/[a-zA-Z0-9\/-]*.css$/.test(request.url.toString())) {
        sendFileContent(response, "./src/" + request.url.toString().substring(1), "text/css");
    } else if (/^\/images\/[a-zA-Z0-9\/-]*.jpg$/.test(request.url.toString())) {
        sendFileContent(response, "./src/" + request.url.toString().substring(1), "image/jpeg");
    } else {
        console.log("Requested URL is: " + request.url);
        response.end();
    }
}).listen(3000);

function sendFileContent(response, fileName, contentType) {
    fs.readFile(fileName, function (err, data) {
        if (err) {
            response.writeHead(404);
            response.write("Not Found!");
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.write(data);
        }
        response.end();
    });
}
