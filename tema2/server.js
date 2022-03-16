const http = require('http');
const url = require('url');
const mysql = require('mysql');
const fnc = require('./functions');


const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234567890',
    database: 'library'
  });
con.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});


const server = http.createServer(async function(req, res) {
    const { pathname } = url.parse(req.url, true);
    if (req.method==="GET"){
        if(pathname === "/books"){
            const queryObject = url.parse(req.url, true).query;
            await fnc.getAllBooks(con,res,queryObject);
        }else{
            id = pathname.split("/")[2];
            endpoint = pathname.split("/")[1];
            badAdd = pathname.split("/")[3];
            if(endpoint != "books"){
                await fnc.badRequest(res);
            }else if(typeof badAdd !== 'undefined'){
                await fnc.badRequest(res);
            }else{
                await fnc.getBookById(con,res,id);
            }
        }
    }else if(req.method === "POST"){
        if(pathname === "/books"){
            var body = '';
            req.on('data', function (data) {
                body += data;
                if (body.length > 1e6)
                    req.socket.destroy();
            });
            req.on('end', async function () {
                try {
                    var post = JSON.parse(body);
                    await fnc.createBook(con,res,post);
                } catch (e) {
                    fnc.badRequest(res);
                }
            });
        }else{
            id = pathname.split("/")[2];
            endpoint = pathname.split("/")[1];
            badAdd = pathname.split("/")[3];
            if(endpoint != "books"){
                await fnc.badRequest(res);
            }else if(typeof badAdd !== 'undefined'){
                await fnc.badRequest(res);
            }else{
                await fnc.createBookById(con,res,id);
            }
        }
    }else if(req.method==="PUT"){
        if(pathname === "/books"){
            await fnc.updateBooks(res);
        }else{
            id = pathname.split("/")[2];
            endpoint = pathname.split("/")[1];
            badAdd = pathname.split("/")[3];
            if(endpoint != "books"){
                await fnc.badRequest(res);
            }else if(typeof badAdd !== 'undefined'){
                await fnc.badRequest(res);
            }else{
                var body = '';
                req.on('data', function (data) {
                    body += data;
                    if (body.length > 1e6)
                        req.socket.destroy();
                });
                req.on('end', async function () {
                    try {
                        var post = JSON.parse(body);
                        await fnc.updateBook(con,res,id,post);
                    } catch (e) {
                        fnc.badRequest(res);
                    }
                });
            }
        }
    }else if(req.method==="DELETE"){
        if(pathname === "/books"){
            await fnc.deleteBooks(res);
        }else{
            id = pathname.split("/")[2];
            endpoint = pathname.split("/")[1];
            badAdd = pathname.split("/")[3];
            if(endpoint != "books"){
                await fnc.badRequest(res);
            }else if(typeof badAdd !== 'undefined'){
                await fnc.badRequest(res);
            }else{
                await fnc.deleteBook(con, res, id);
            }
        }
    }else{
        fnc.notImplemented(res);
    }
  });

server.listen(8000, "127.0.0.1", () => {
    console.log("Server is listening to requests on port 8000");
});
