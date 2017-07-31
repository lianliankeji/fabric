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
app.get('/gw/deploy',function(req, res){  

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
                    chaincodePath: "/usr/local/llwork/api/ccpath"
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

                    "results": "chaincode deploying... , wait about 2 minutes to check it"
                };

                res.send(body)
            })

        }

    });

});  

app.get('/gw/syndata', function(req, res) { 

    chain.enroll("admin", "Xurw3yU9zI0l", function (err, user) {
        
        if (err) {
            console.log("ERROR: failed to register user: %s",err);
            res.send("admin" + ' not regist or pw error')
        }
                
        console.log("**** Enrolled ****");

        var ccId = req.query.ccId;
        var txId = req.query.txId;
        var func = req.query.func;
        var argsJson = req.query.argsJson;

        var invokeRequest = {
            
            chaincodeID: ccId,
            fcn: func,
            args: [txId, argsJson, ccId]
        };   
        
        // invoke
        var tx = user.invoke(invokeRequest);

        tx.on('complete', function (results) {
            
            console.log("invoke completed successfully: request=%j, results=%j",invokeRequest,results.result.toString());

        });
        tx.on('error', function (error) {
            
            console.log("Failed to invoke chaincode: request=%j, error=%k",invokeRequest,error);

        });

        res.send('syndata successfully, wait notify....'); 

    });   
});

app.get('/gw/checkdata', function(req, res) { 

    chain.enroll("admin", "Xurw3yU9zI0l", function (err, user) {
        
        if (err) {
            console.log("ERROR: failed to register user: %s",err);
            res.send("admin" + ' not regist or pw error')
        }
                
        console.log("**** Enrolled ****");
  
        var ccId = req.query.ccId;
        var txId = req.query.txId;
        var func = req.query.func;

        var queryRequest = {
            
            chaincodeID: ccId,
            fcn: func,
            args: [txId]
        };   
        
        // invoke
        var tx = user.query(queryRequest);

        tx.on('complete', function (results) {
            
            console.log("query completed successfully: request=%j, results=%j",queryRequest,results);

            res.send(results.result.toString())

        });
        tx.on('error', function (error) {
            
            console.log("Failed to query chaincode: request=%j, error=%k",queryRequest,error);

        });

    });   
});

app.get('/gw/subscribe', function(req, res) { 

    res.set({'Content-Type':'text/json','Encodeing':'utf8'});   

    var eh = chain.getEventHub();

    var ccId = req.query.ccId;

    // register for chaincode event
    var regid = eh.registerChaincodeEvent(ccId, "notify", function(event) {
            
        console.log("event============ " + event.payload);
        
        var payload = JSON.parse(event.payload.toString());
        
        var superagent = require('superagent');

        // url + params
        // var url  = "http://localhost:8076/" + payload.func;

        // var data = event.payload;
        var url = "http://192.168.10.108:8080/sync/callback"
        
        var state = "2"
        if(payload.error == "") state = "0"
        else state = "1"

        var data = "txId=" + payload.txid + "&state=" + state

        console.log("url===== " + url);
        console.log("data===== " + data);
  
        var sreq = superagent.post(url).send(data).end(function(err, resHt){

            if (err || !resHt.ok) {
                
                // 异常重新提交策略 log
                console.log("notify error...., url="+url+", data="+data)
            }   

        });

    });

    res.send('subscribe successfully, wait notify....'); 
    
});

 
app.listen(8078, "127.0.0.1");

console.log("listen on 8078...");

