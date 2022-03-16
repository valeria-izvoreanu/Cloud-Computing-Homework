const http = require('http');
const url = require('url');
const mysql = require('mysql');
const { sign } = require('crypto');

var handlers = {
    getAllBooks : async function(con,res,queryObject) { 
        sql_query="SELECT * FROM books ";
        let where=false;
        if (typeof queryObject.title !== 'undefined'){
            if(!where){
                sql_query+="WHERE ";
                where=true;
            }
            sql_query=sql_query+"title=\""+queryObject.title+"\" "
            delete queryObject.title;
        }
        if (typeof queryObject.author !== 'undefined'){
            if(!where){
                sql_query+="WHERE ";
                where=true;
            }else{
                sql_query+="AND ";
            }
            sql_query=sql_query+"author=\""+queryObject.author+"\" "
            delete queryObject.author ;
        }
        if (typeof queryObject.country !== 'undefined'){
            if(!where){
                sql_query+="WHERE ";
                where=true;
            }else{
                sql_query+="AND ";
            }
            sql_query=sql_query+"country=\""+queryObject.country+"\" "
            delete queryObject.country;
        } 
        if (typeof queryObject.rating !== 'undefined'){
            if(!where){
                sql_query+="WHERE ";
                where=true;
            }else{
                sql_query+="AND ";
            }
            values=queryObject.rating.split(":")[0];
            number=queryObject.rating.split(":")[1];
            var sign = this.getSign(values,number);
            if (sign=="-"){
                this.badRequest(res);
                return;
            }else{
                sql_query=sql_query+"rating"+sign+number+" "
            }
            delete queryObject.rating;
        }
        if (typeof queryObject.year_of_publishing !== 'undefined'){
            if(!where){
                sql_query+="WHERE ";
                where=true;
            }else{
                sql_query+="AND ";
            }
            values=queryObject.year_of_publishing.split(":")[0];
            number=queryObject.year_of_publishing.split(":")[1];
            var sign = this.getSign(values,number);
            if (sign=="-"){
                if(!isNaN(Number(values))){
                    sql_query=sql_query+"year_of_publishing="+values+" "
                }else{
                    this.badRequest(res);
                    return;
                }
            }else{
                sql_query=sql_query+"year_of_publishing"+sign+number+" "
            }
            delete queryObject.year_of_publishing;
        }
        if (typeof queryObject.pages !== 'undefined'){
            if(!where){
                sql_query+="WHERE ";
                where=true;
            }else{
                sql_query+="AND ";
            }
            values=queryObject.pages.split(":")[0];
            number=queryObject.pages.split(":")[1];
            var sign = this.getSign(values,number);
            if (sign=="-"){
                if(!isNaN(Number(values))){
                    sql_query=sql_query+"pages="+values+" "
                }else{
                    this.badRequest(res);
                    return;
                }
            }else{
                sql_query=sql_query+"pages"+sign+number+" "
            }
            delete queryObject.pages;
        }
        if (typeof queryObject.sort !== 'undefined'){
            sql_query+="ORDER BY "
            field=queryObject.sort.split(":")[0];
            order=queryObject.sort.split(":")[1];
            sql_query=sql_query+field+" ";
            if (typeof order !== 'undefined'){
                sql_query=sql_query+order+" "
            }
            delete queryObject.sort;
        }
        offset_txt="";
        if (typeof queryObject.offset !== 'undefined'){
            offset_txt+="OFFSET "
            offset_txt=offset_txt+queryObject.offset+" ";
        }
        var pagination = {} // empty Object
        if (typeof queryObject.limit !== 'undefined'){
            sql_query+="LIMIT "
            sql_query=sql_query+queryObject.limit+" ";
            if (offset_txt === ""){
                var key = 'Next';
                pagination[key] ="/books?limit="+queryObject.limit+"&offset="+queryObject.limit;
            }else{
                sql_query+=offset_txt;
                var key = 'Previous';
                var offset_value=Number(queryObject.offset)-Number(queryObject.limit);
                pagination[key] ="/books?limit="+queryObject.limit+"&offset="+offset_value.toString();
                key = 'Next';
                offset_value=Number(queryObject.offset)+Number(queryObject.limit)
                pagination[key] ="/books?limit="+queryObject.limit+"&offset="+offset_value.toString();
                delete queryObject.offset;
            }
            JSON.stringify(pagination);
            delete queryObject.limit;
        }
        sql_query+=";";
        const isEmptyQuery = Object.keys(queryObject).length === 0;
        if(!isEmptyQuery){
            this.badRequest(res);
            return;
        }
        
        con.query(sql_query, (err,rows) => {
            if(err) {
                if(err.errno===1054){
                    this.invalidId(res);
                }else{
                    this.internServerErr(res);
                }
                return;
            }
            if (rows.length === 0){
                this.notFound(res);
                return;
             } else{
                res.writeHead(200, {
                     "Content-type": "application/json"
                      });
                const isEmptyPag = Object.keys(pagination).length === 0;
                if(!isEmptyPag){
                    var answer= {};
                    var key="data";
                    answer[key]=rows;
                    key="paging";
                    answer[key]=pagination;
                    res.end(JSON.stringify(answer))
                }else{
                    res.end(JSON.stringify(rows));
                }
             }
        });
    },

    getBookById : async function(con, res,id){
        sqlQuery='SELECT * FROM books WHERE idbooks='+id+";";
        con.query(sqlQuery, (err,rows) => {
                if(err) {
                    if(err.errno===1054){
                        this.invalidId(res);
                    }else{
                        this.internServerErr(res);
                    }
                }else{
                    if (rows.length === 0){
                       this.notFound(res);
                    } else{
                        res.writeHead(200, {
                            "Content-type": "application/json"
                             });
                        res.end(JSON.stringify(rows));
                    }
                }
            });
    },
    createBook : async function(con, res, body){
        if (typeof body.title !== 'undefined' && typeof body.author !== 'undefined' && typeof body.description !== 'undefined' &&
        typeof body.rating !== 'undefined' && typeof body.year_of_publishing !== 'undefined' && typeof body.pages !== 'undefined' &&
        typeof body.country !== 'undefined'){
            sql_query="INSERT INTO books (title, author, description, rating, year_of_publishing,pages,country)VALUES (\""+
            body.title+"\",\""+body.author+"\",\""+body.description+"\","+body.rating+","+body.year_of_publishing+","+body.pages+",\""+body.country+"\");";
            con.query(sql_query, (err, response) => {
                if(err) {
                    if(err.errno===1062){
                         this.duplicate(res);
                    }else{
                         this.internServerErr(res);
                    }
                }else{
                    //console.log('Last insert ID:', response.insertId);
                    res.setHeader('Location', "/books/"+response.insertId);
                    res.writeHead(201, {
                        "Content-type": "application/json"
                         });
                    res.end();
                }
              });
        }else{
             this.badRequest(res);
        }
        
    },
    createBookById : async function(con, res,id){
        sqlQuery='SELECT * FROM books WHERE idbooks='+id+";";
        con.query(sqlQuery, (err,rows) => {
                if(err) {
                     this.internServerErr(res);
                }else{
                    if (rows.length === 0){
                         this.notFound(res);
                    } else{
                         this.duplicate(res);
                    }
                }
            });
    },
    updateBooks : async function(res){
         this.methodNotAllowed(res);
    },
    updateBook : async function(con, res, id,body){
        if (typeof body.title !== 'undefined' && typeof body.author !== 'undefined' && typeof body.description !== 'undefined' &&
        typeof body.rating !== 'undefined' && typeof body.year_of_publishing !== 'undefined' && typeof body.pages !== 'undefined' &&
        typeof body.country !== 'undefined'){
            sql_query="UPDATE books SET title=\""+body.title+"\", author=\""+body.author+"\",description=\""
            +body.description+"\",rating="+body.rating+",year_of_publishing="+
            body.year_of_publishing+",pages="+body.pages+",country=\""+body.country+"\" WHERE idbooks="+id+";";
            con.query(sql_query, (err, response) => {
                if(err) {
                    if(err.errno===1062){
                         this.duplicate(res);
                    }else if(err.errno===1054){
                         this.invalidId(res);
                    }else{
                         this.internServerErr(res);
                    }
                }else{
                    if (response.changedRows === 0){
                         this.notFound(res);
                    } else{
                        res.writeHead(204, {
                            "Content-type": "none"
                            });
                        res.end();
                    }
                }
            });
        }else{
             this.badRequest(res);
        }
    },
    deleteBooks : async function(res){
         this.methodNotAllowed(res);
    },
    deleteBook : async function(con, res, id){
        sql_query="DELETE FROM books WHERE idbooks="+id+";";
        con.query(sql_query, (err, response) => {
            if(err) {
                if(err.errno===1054){
                     this.invalidId(res);
                }else{
                     this.internServerErr(res);
                }
            }else{
                if (response.affectedRows === 0){
                     this.notFound(res);
                } else{
                    res.writeHead(200, {
                        "Content-type": "none"
                         });
                    res.end();
                }
            }
          });
    },
    badRequest : async function(res){
        res.writeHead(400, {
            "Content-type": "none"
             });
        res.end();
    },
    notImplemented : async function(res){
        res.writeHead(501, {
            "Content-type": "none"
             });
        res.end();
    },
    internServerErr : async function(res){
        res.writeHead(500, {
            "Content-type": "none"
             });
        res.end();
    },
    invalidId : async function(res){
        res.writeHead(404, {
            "Content-type": "text/html"
             });
        res.end("Invalid");
    },
    notFound : async function(res){
        res.writeHead(404, {
            "Content-type": "none"
             });
        res.end();
    },
    duplicate : async function(res){
        res.writeHead(409, {
            "Content-type": "none"
             });
        res.end();
    },
    methodNotAllowed : async function(res){
        res.writeHead(405, {
            "Content-type": "none"
             });
        res.end();
    },
    getSign : function(txt,number){
        console.log(number);
        if(txt== 'gt') return ">";
        else if(txt == 'gte') return ">=";
        else if(txt == 'lt') return "<";
        else if(txt == 'lte') return "<=";
        //else if (typeof number === 'undefined') return "=";
        else return "-";
    }
}

module.exports = handlers;