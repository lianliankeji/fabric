/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

                 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

//WARNING - this chaincode's ID is hard-coded in chaincode_example04 to illustrate one way of
//calling chaincode from a chaincode. If this example is modified, chaincode_example04.go has
//to be modified as well with the new ID of chaincode_example02.
//chaincode_example05 show's how chaincode ID can be passed in as a parameter instead of
//hard-coding.

import (
	"errors"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type EventSender struct {
}

func (t *EventSender) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	return nil, nil
}

// Transaction makes payment of X units from A to B
func (t *EventSender) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) (
	[]byte, error) {

	var user, ehr string

	user = args[0]
	ehr = args[1]

	err := stub.PutState(user, []byte(ehr))

	if err != nil {
		return nil, err
	}

	return nil, nil
}

// Query callback representing the query of a chaincode
func (t *EventSender) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	var user = args[0]

	// Get the state from the ledger
	ehr, err := stub.GetState(user)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get ehr for " + user + "\"}"
		return nil, errors.New(jsonResp)
	}

	return ehr, nil
}

func main() {
	err := shim.Start(new(EventSender))
	if err != nil {
		fmt.Printf("Error starting EventSender chaincode: %s", err)
	}
}
