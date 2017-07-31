package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type EventSender struct {
}

func (t *EventSender) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	// 规则
	return nil, nil
}

func (t *EventSender) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	// event send
	eventBody := make(map[string]string)
	eventBody["error"] = ""
	eventBody["func"] = function
	eventBody["txid"] = args[0]
	eventBody["args"] = args[1]
	eventBody["ccId"] = args[2]

	eventPayload, err := json.Marshal(eventBody)

	// 重复提交
	state, err := stub.GetState(args[0] + "_state")
	if err != nil {
		return nil, errors.New("Failed to get state")
	}
	if state != nil {

		eventBody["error"] = "tx already commit"
		eventPayload, err := json.Marshal(eventBody)

		err = stub.SetEvent("tx", eventPayload)
		if err != nil {
			return nil, err
		}
		return nil, errors.New("tx already commit")
	}
	// 2:处理中
	err = stub.PutState(args[0]+"_state", []byte("2"))
	if err != nil {
		return nil, err
	}

	// payload
	err = stub.PutState(args[0]+"_payload", []byte(eventPayload))
	if err != nil {
		return nil, err
	}

	if err != nil {

		err = stub.SetEvent("tx", []byte("err @ tx.go..."))
		if err != nil {
			return nil, err
		}
		// tx state
		// 1:失败
		err = stub.PutState(args[0]+"_state", []byte("1"))
		if err != nil {
			return nil, err
		}

	} else {

		err = stub.SetEvent("tx", eventPayload)
		if err != nil {
			return nil, err
		}
		// tx state
		// 0:成功
		err = stub.PutState(args[0]+"_state", []byte("0"))
		if err != nil {
			return nil, err
		}
	}

	return nil, nil
}

func (t *EventSender) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	var jsonR string

	if function == "payload" {

		// payload query
		payload, err := stub.GetState(args[0] + "_payload")
		if err != nil {
			return nil, errors.New("Failed to get payload")
		}

		resBody := make(map[string]string)
		resBody["txid"] = args[0]
		resBody["payload"] = string(payload)

		jsonResp, err := json.Marshal(resBody)

		jsonR = string(jsonResp)

	}

	if function == "state" {

		// state query
		state, err := stub.GetState(args[0] + "_state")
		if err != nil {
			return nil, errors.New("Failed to get state")
		}

		resBody := make(map[string]string)
		resBody["txid"] = args[0]
		resBody["state"] = string(state)

		jsonResp, err := json.Marshal(resBody)

		jsonR = string(jsonResp)
	}

	return []byte(jsonR), nil
}

func main() {
	err := shim.Start(new(EventSender))
	if err != nil {
		fmt.Printf("Error starting EventSender: %s", err)
	}
}
