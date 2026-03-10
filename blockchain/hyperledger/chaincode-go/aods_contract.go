package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// AODSContract provides functions for managing AODS enterprise blockchain
type AODSContract struct {
	contractapi.Contract
}

// Asset types for enterprise blockchain
const (
	ASSET_TYPE_PRODUCT     = "PRODUCT"
	ASSET_TYPE_DOCUMENT    = "DOCUMENT"
	ASSET_TYPE_TRANSACTION = "TRANSACTION"
	ASSET_TYPE_IDENTITY    = "IDENTITY"
)

// AssetStatus represents the status of an asset
const (
	STATUS_ACTIVE    = "ACTIVE"
	STATUS_INACTIVE  = "INACTIVE"
	STATUS_PENDING   = "PENDING"
	STATUS_COMPLETED = "COMPLETED"
	STATUS_REVOKED   = "REVOKED"
)

// Asset represents a generic asset on the blockchain
type Asset struct {
	ID           string            `json:"id"`
	Type         string            `json:"type"`
	Owner        string            `json:"owner"`
	Status       string            `json:"status"`
	Data         map[string]interface{} `json:"data"`
	CreatedAt    string            `json:"createdAt"`
	UpdatedAt    string            `json:"updatedAt"`
	CreatedBy    string            `json:"createdBy"`
	Version      int               `json:"version"`
	History      []AssetHistory    `json:"history"`
	Signatures   []Signature       `json:"signatures"`
}

// AssetHistory tracks changes to an asset
type AssetHistory struct {
	Timestamp string                 `json:"timestamp"`
	Action    string                 `json:"action"`
	Actor     string                 `json:"actor"`
	Changes   map[string]interface{} `json:"changes"`
}

// Signature represents a digital signature
type Signature struct {
	Signer    string `json:"signer"`
	Signature string `json:"signature"`
	Timestamp string `json:"timestamp"`
}

// Transaction represents a blockchain transaction
type Transaction struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	From        string                 `json:"from"`
	To          string                 `json:"to"`
	Amount      float64                `json:"amount"`
	Currency    string                 `json:"currency"`
	Status      string                 `json:"status"`
	Data        map[string]interface{} `json:"data"`
	Timestamp   string                 `json:"timestamp"`
	BlockNumber int64                  `json:"blockNumber"`
	TxHash      string                 `json:"txHash"`
}

// Identity represents a digital identity
type Identity struct {
	ID              string            `json:"id"`
	DID             string            `json:"did"`
	Owner           string            `json:"owner"`
	PublicKey       string            `json:"publicKey"`
	Credentials     []Credential      `json:"credentials"`
	Status          string            `json:"status"`
	VerificationLevel int             `json:"verificationLevel"`
	CreatedAt       string            `json:"createdAt"`
	UpdatedAt       string            `json:"updatedAt"`
}

// Credential represents a verifiable credential
type Credential struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Issuer      string `json:"issuer"`
	IssuedAt    string `json:"issuedAt"`
	ExpiresAt   string `json:"expiresAt"`
	Data        map[string]interface{} `json:"data"`
	Signature   string `json:"signature"`
	Status      string `json:"status"`
}

// Product represents a supply chain product
type Product struct {
	ID          string            `json:"id"`
	SKU         string            `json:"sku"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Manufacturer string           `json:"manufacturer"`
	Owner       string            `json:"owner"`
	Status      string            `json:"status"`
	Location    Location          `json:"location"`
	Certifications []Certification `json:"certifications"`
	IoTData     []IoTReading      `json:"iotData"`
	CreatedAt   string            `json:"createdAt"`
	UpdatedAt   string            `json:"updatedAt"`
}

// Location represents a geographic location
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
	Timestamp string  `json:"timestamp"`
}

// Certification represents a product certification
type Certification struct {
	Type      string `json:"type"`
	Issuer    string `json:"issuer"`
	IssuedAt  string `json:"issuedAt"`
	ExpiresAt string `json:"expiresAt"`
	Data      map[string]interface{} `json:"data"`
}

// IoTReading represents IoT sensor data
type IoTReading struct {
	SensorID    string                 `json:"sensorId"`
	SensorType  string                 `json:"sensorType"`
	Value       float64                `json:"value"`
	Unit        string                 `json:"unit"`
	Timestamp   string                 `json:"timestamp"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// ==================== Asset Management ====================

// CreateAsset creates a new asset on the blockchain
func (c *AODSContract) CreateAsset(ctx contractapi.TransactionContextInterface, 
	id string, assetType string, owner string, data string) (*Asset, error) {
	
	exists, err := c.AssetExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("asset %s already exists", id)
	}

	var assetData map[string]interface{}
	if err := json.Unmarshal([]byte(data), &assetData); err != nil {
		return nil, fmt.Errorf("invalid data format: %v", err)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	clientID, _ := ctx.GetClientIdentity().GetID()

	asset := Asset{
		ID:        id,
		Type:      assetType,
		Owner:     owner,
		Status:    STATUS_ACTIVE,
		Data:      assetData,
		CreatedAt: timestamp,
		UpdatedAt: timestamp,
		CreatedBy: clientID,
		Version:   1,
		History: []AssetHistory{
			{
				Timestamp: timestamp,
				Action:    "CREATE",
				Actor:     clientID,
				Changes:   assetData,
			},
		},
		Signatures: []Signature{},
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, assetJSON)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

// ReadAsset retrieves an asset from the blockchain
func (c *AODSContract) ReadAsset(ctx contractapi.TransactionContextInterface, id string) (*Asset, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read asset: %v", err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("asset %s does not exist", id)
	}

	var asset Asset
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

// UpdateAsset updates an existing asset
func (c *AODSContract) UpdateAsset(ctx contractapi.TransactionContextInterface, 
	id string, newData string) (*Asset, error) {
	
	asset, err := c.ReadAsset(ctx, id)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(newData), &data); err != nil {
		return nil, fmt.Errorf("invalid data format: %v", err)
	}

	clientID, _ := ctx.GetClientIdentity().GetID()
	timestamp := time.Now().UTC().Format(time.RFC3339)

	// Record history
	historyEntry := AssetHistory{
		Timestamp: timestamp,
		Action:    "UPDATE",
		Actor:     clientID,
		Changes:   data,
	}
	asset.History = append(asset.History, historyEntry)

	// Update asset
	asset.Data = data
	asset.UpdatedAt = timestamp
	asset.Version++

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, assetJSON)
	if err != nil {
		return nil, err
	}

	return asset, nil
}

// DeleteAsset removes an asset from the blockchain
func (c *AODSContract) DeleteAsset(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := c.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("asset %s does not exist", id)
	}

	return ctx.GetStub().DelState(id)
}

// TransferAsset transfers ownership of an asset
func (c *AODSContract) TransferAsset(ctx contractapi.TransactionContextInterface, 
	id string, newOwner string) (*Asset, error) {
	
	asset, err := c.ReadAsset(ctx, id)
	if err != nil {
		return nil, err
	}

	clientID, _ := ctx.GetClientIdentity().GetID()
	timestamp := time.Now().UTC().Format(time.RFC3339)

	oldOwner := asset.Owner
	asset.Owner = newOwner
	asset.UpdatedAt = timestamp
	asset.Version++

	// Record history
	historyEntry := AssetHistory{
		Timestamp: timestamp,
		Action:    "TRANSFER",
		Actor:     clientID,
		Changes: map[string]interface{}{
			"from": oldOwner,
			"to":   newOwner,
		},
	}
	asset.History = append(asset.History, historyEntry)

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, assetJSON)
	if err != nil {
		return nil, err
	}

	return asset, nil
}

// AssetExists checks if an asset exists
func (c *AODSContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read asset: %v", err)
	}
	return assetJSON != nil, nil
}

// GetAssetHistory retrieves the history of an asset
func (c *AODSContract) GetAssetHistory(ctx contractapi.TransactionContextInterface, id string) ([]AssetHistory, error) {
	asset, err := c.ReadAsset(ctx, id)
	if err != nil {
		return nil, err
	}
	return asset.History, nil
}

// ==================== Product/Supply Chain ====================

// CreateProduct creates a new product for supply chain tracking
func (c *AODSContract) CreateProduct(ctx contractapi.TransactionContextInterface,
	id string, sku string, name string, description string, manufacturer string) (*Product, error) {

	exists, err := c.AssetExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("product %s already exists", id)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	clientID, _ := ctx.GetClientIdentity().GetID()

	product := Product{
		ID:             id,
		SKU:            sku,
		Name:           name,
		Description:    description,
		Manufacturer:   manufacturer,
		Owner:          manufacturer,
		Status:         STATUS_ACTIVE,
		Certifications: []Certification{},
		IoTData:        []IoTReading{},
		CreatedAt:      timestamp,
		UpdatedAt:      timestamp,
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, productJSON)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// UpdateProductLocation updates the location of a product
func (c *AODSContract) UpdateProductLocation(ctx contractapi.TransactionContextInterface,
	id string, latitude float64, longitude float64, address string) (*Product, error) {

	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	product.Location = Location{
		Latitude:  latitude,
		Longitude: longitude,
		Address:   address,
		Timestamp: timestamp,
	}
	product.UpdatedAt = timestamp

	productJSON, err = json.Marshal(product)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, productJSON)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// AddIoTData adds IoT sensor data to a product
func (c *AODSContract) AddIoTData(ctx contractapi.TransactionContextInterface,
	id string, sensorID string, sensorType string, value float64, unit string, metadata string) (*Product, error) {

	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	var meta map[string]interface{}
	if metadata != "" {
		json.Unmarshal([]byte(metadata), &meta)
	}

	reading := IoTReading{
		SensorID:   sensorID,
		SensorType: sensorType,
		Value:      value,
		Unit:       unit,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		Metadata:   meta,
	}

	product.IoTData = append(product.IoTData, reading)
	product.UpdatedAt = reading.Timestamp

	productJSON, err = json.Marshal(product)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, productJSON)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// AddCertification adds a certification to a product
func (c *AODSContract) AddCertification(ctx contractapi.TransactionContextInterface,
	id string, certType string, issuer string, expiresAt string, data string) (*Product, error) {

	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	var certData map[string]interface{}
	if data != "" {
		json.Unmarshal([]byte(data), &certData)
	}

	cert := Certification{
		Type:      certType,
		Issuer:    issuer,
		IssuedAt:  time.Now().UTC().Format(time.RFC3339),
		ExpiresAt: expiresAt,
		Data:      certData,
	}

	product.Certifications = append(product.Certifications, cert)
	product.UpdatedAt = cert.IssuedAt

	productJSON, err = json.Marshal(product)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, productJSON)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// GetProduct retrieves a product
func (c *AODSContract) GetProduct(ctx contractapi.TransactionContextInterface, id string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// ==================== Identity Management ====================

// CreateIdentity creates a new digital identity
func (c *AODSContract) CreateIdentity(ctx contractapi.TransactionContextInterface,
	did string, publicKey string) (*Identity, error) {

	clientID, _ := ctx.GetClientIdentity().GetID()
	
	exists, err := c.AssetExists(ctx, did)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("identity %s already exists", did)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)

	identity := Identity{
		ID:                did,
		DID:               did,
		Owner:             clientID,
		PublicKey:         publicKey,
		Credentials:       []Credential{},
		Status:            STATUS_ACTIVE,
		VerificationLevel: 0,
		CreatedAt:         timestamp,
		UpdatedAt:         timestamp,
	}

	identityJSON, err := json.Marshal(identity)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(did, identityJSON)
	if err != nil {
		return nil, err
	}

	return &identity, nil
}

// GetIdentity retrieves an identity
func (c *AODSContract) GetIdentity(ctx contractapi.TransactionContextInterface, did string) (*Identity, error) {
	identityJSON, err := ctx.GetStub().GetState(did)
	if err != nil {
		return nil, err
	}
	if identityJSON == nil {
		return nil, fmt.Errorf("identity %s does not exist", did)
	}

	var identity Identity
	err = json.Unmarshal(identityJSON, &identity)
	if err != nil {
		return nil, err
	}

	return &identity, nil
}

// AddCredential adds a credential to an identity
func (c *AODSContract) AddCredential(ctx contractapi.TransactionContextInterface,
	did string, credType string, issuer string, expiresAt string, data string, signature string) (*Identity, error) {

	identity, err := c.GetIdentity(ctx, did)
	if err != nil {
		return nil, err
	}

	var credData map[string]interface{}
	if data != "" {
		json.Unmarshal([]byte(data), &credData)
	}

	credID := fmt.Sprintf("%s-%s-%d", did, credType, len(identity.Credentials))
	
	credential := Credential{
		ID:        credID,
		Type:      credType,
		Issuer:    issuer,
		IssuedAt:  time.Now().UTC().Format(time.RFC3339),
		ExpiresAt: expiresAt,
		Data:      credData,
		Signature: signature,
		Status:    STATUS_ACTIVE,
	}

	identity.Credentials = append(identity.Credentials, credential)
	identity.VerificationLevel++
	identity.UpdatedAt = credential.IssuedAt

	identityJSON, err := json.Marshal(identity)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(did, identityJSON)
	if err != nil {
		return nil, err
	}

	return identity, nil
}

// VerifyCredential verifies a credential
func (c *AODSContract) VerifyCredential(ctx contractapi.TransactionContextInterface,
	did string, credID string) (bool, error) {

	identity, err := c.GetIdentity(ctx, did)
	if err != nil {
		return false, err
	}

	for _, cred := range identity.Credentials {
		if cred.ID == credID {
			if cred.Status != STATUS_ACTIVE {
				return false, nil
			}
			if cred.ExpiresAt != "" {
				expires, _ := time.Parse(time.RFC3339, cred.ExpiresAt)
				if time.Now().UTC().After(expires) {
					return false, nil
				}
			}
			return true, nil
		}
	}

	return false, nil
}

// ==================== Transaction Management ====================

// CreateTransaction creates a new transaction record
func (c *AODSContract) CreateTransaction(ctx contractapi.TransactionContextInterface,
	id string, txType string, from string, to string, amount float64, currency string, data string) (*Transaction, error) {

	exists, err := c.AssetExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("transaction %s already exists", id)
	}

	var txData map[string]interface{}
	if data != "" {
		json.Unmarshal([]byte(data), &txData)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)

	transaction := Transaction{
		ID:        id,
		Type:      txType,
		From:      from,
		To:        to,
		Amount:    amount,
		Currency:  currency,
		Status:    STATUS_PENDING,
		Data:      txData,
		Timestamp: timestamp,
	}

	txJSON, err := json.Marshal(transaction)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, txJSON)
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// ConfirmTransaction confirms a transaction
func (c *AODSContract) ConfirmTransaction(ctx contractapi.TransactionContextInterface, id string) (*Transaction, error) {
	txJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if txJSON == nil {
		return nil, fmt.Errorf("transaction %s does not exist", id)
	}

	var transaction Transaction
	err = json.Unmarshal(txJSON, &transaction)
	if err != nil {
		return nil, err
	}

	transaction.Status = STATUS_COMPLETED
	transaction.TxHash = ctx.GetStub().GetTxID()

	txJSON, err = json.Marshal(transaction)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(id, txJSON)
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// GetTransaction retrieves a transaction
func (c *AODSContract) GetTransaction(ctx contractapi.TransactionContextInterface, id string) (*Transaction, error) {
	txJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if txJSON == nil {
		return nil, fmt.Errorf("transaction %s does not exist", id)
	}

	var transaction Transaction
	err = json.Unmarshal(txJSON, &transaction)
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// ==================== Query Functions ====================

// QueryAssetsByType queries assets by type
func (c *AODSContract) QueryAssetsByType(ctx contractapi.TransactionContextInterface, assetType string) ([]*Asset, error) {
	queryString := fmt.Sprintf(`{"selector":{"type":"%s"}}`, assetType)
	return c.queryAssets(ctx, queryString)
}

// QueryAssetsByOwner queries assets by owner
func (c *AODSContract) QueryAssetsByOwner(ctx contractapi.TransactionContextInterface, owner string) ([]*Asset, error) {
	queryString := fmt.Sprintf(`{"selector":{"owner":"%s"}}`, owner)
	return c.queryAssets(ctx, queryString)
}

// QueryAssetsByStatus queries assets by status
func (c *AODSContract) QueryAssetsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Asset, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	return c.queryAssets(ctx, queryString)
}

func (c *AODSContract) queryAssets(ctx contractapi.TransactionContextInterface, queryString string) ([]*Asset, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*Asset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

// GetAllAssets returns all assets
func (c *AODSContract) GetAllAssets(ctx contractapi.TransactionContextInterface) ([]*Asset, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*Asset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			continue // Skip non-asset entries
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&AODSContract{})
	if err != nil {
		fmt.Printf("Error creating chaincode: %v\n", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting chaincode: %v\n", err)
	}
}
