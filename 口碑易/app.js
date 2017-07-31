// app index
var express = require('express');  
var app = express();  

var bodyParser = require('body-parser');  

var hfc = require('hfc');
var fs = require('fs');
var util = require('util');

// block
console.log(" **** starting HFC sample ****");

var MEMBERSRVC_ADDRESS = "grpc://127.0.0.1:7054";
var PEER_ADDRESS = "grpc://127.0.0.1:7051";
var EVENTHUB_ADDRESS = "grpc://127.0.0.1:7053";

// var pem = fs.readFileSync('./cert/us.blockchain.ibm.com.cert'); 
var chain = hfc.newChain("testChain");
var keyValStorePath = "/usr/local/llwork/hfc_keyValStore";

chain.setDevMode(false);
chain.setECDSAModeForGRPC(true);

chain.eventHubConnect(EVENTHUB_ADDRESS);

var eh = chain.getEventHub();

process.on('exit', function (){
  chain.eventHubDisconnect();
});

chain.setKeyValStore(hfc.newFileKeyValStore(keyValStorePath));
chain.setMemberServicesUrl(MEMBERSRVC_ADDRESS);
chain.addPeer(PEER_ADDRESS);

// parse application/x-www-form-urlencoded  
app.use(bodyParser.urlencoded({ extended: false }))  
// parse application/json  
app.use(bodyParser.json())  

// restfull
app.get('/app/deploy',function(req, res){  

    chain.enroll('admin', 'Xurw3yU9zI0l', function (err, user) {

        res.set({'Content-Type':'text/json','Encodeing':'utf8'});  
        
        if (err) {

            console.log("Failed to register: error=%k",err.toString());
            res.send(err.toString()) 
        
        } else {

            var attr;
            
            user.getUserCert(attr, function (err, userCert) {

                console.log("enroll and getUserCert successfully!!!!!")

                if (err) {

                    console.log(err);
                }
            
                var deployRequest = {
                
                    fcn: "init",
                    args: [],
                    chaincodePath: "/usr/local/llwork/api/apiccpath"
                };

                // Trigger the deploy transaction
                var deployTx = user.deploy(deployRequest);

                // Print the deploy results
                deployTx.on('complete', function(results) {
                    
                    console.log("results.chaincodeID=========="+results.chaincodeID);

                });

                deployTx.on('error', function(err) {
                    
                    console.log("err=========="+err.toString());
                });

                var body = {

                    "results": "OK"
                };

                res.send(body)
            })

        }

    });

});  

app.get('/app/invoke', function(req, res) { 

    chain.enroll("admin", "Xurw3yU9zI0l", function (err, user) {
        
        if (err) {
            console.log("ERROR: failed to register user: %s",err);
            res.send("admin" + ' not regist or pw error')
        }
                
        console.log("**** Enrolled ****");

        var ccId = req.query.ccId;
        var func = req.query.func;

        var acc = req.query.acc;
        var reacc = req.query.reacc;
        var amt = req.query.amt;

        var invokeRequest = {
            
            chaincodeID: ccId,
            fcn: func,
            args: [acc, amt, reacc]
        };   
        
        // invoke
        var tx = user.invoke(invokeRequest);

        tx.on('complete', function (results) {
            
            console.log("invoke completed successfully: request=%j, results=%j",invokeRequest,results.result.toString());
            
            res.send(results.result.toString()); 

        });
        tx.on('error', function (error) {
            
            console.log("Failed to invoke chaincode: request=%j, error=%k",invokeRequest,error);

            res.send("tx error"); 

        });

    });   
});

app.get('/app/query', function(req, res) { 

    chain.enroll("admin", "Xurw3yU9zI0l", function (err, user) {
        
        if (err) {
            console.log("ERROR: failed to register user: %s",err);
            res.send("admin" + ' not regist or pw error')
        }
                
        console.log("**** Enrolled ****");
  
        var ccId = req.query.ccId;
        var func = req.query.func;

        var acc = req.query.acc;

        var queryRequest = {
            
            chaincodeID: ccId,
            fcn: func,
            args: [acc]
        };   
        
        // invoke
        var tx = user.query(queryRequest);

        tx.on('complete', function (results) {
            
            console.log("query completed successfully: request=%j, results=%j",queryRequest,results);

            res.send(results.result.toString())

        });
        tx.on('error', function (error) {
            
            console.log("Failed to query chaincode: request=%j, error=%k",queryRequest,error);

            res.send("tx error"); 

        });

    });   
});

 
app.listen(8088, "127.0.0.1");

console.log("listen on 8088...");

