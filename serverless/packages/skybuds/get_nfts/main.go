package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// Event represents the incoming event structure
type Event struct {
	Chain string `json:"chain"`
}

// AlchemyResponse represents the response from Alchemy API
type AlchemyResponse struct {
	NFTs []AlchemyNFT `json:"nfts"`
}

// AlchemyNFT represents an NFT object from Alchemy
type AlchemyNFT struct {
	Contract    interface{} `json:"contract"`
	TokenID     string      `json:"tokenId"`
	TokenType   string      `json:"tokenType"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	TokenURI    *string     `json:"tokenUri"` // Using pointer for null values
	Image       interface{} `json:"image"`    // We don't need the full image structure
	Raw         AlchemyRaw  `json:"raw"`
}

// AlchemyRaw represents the raw data including metadata
type AlchemyRaw struct {
	TokenURI string                 `json:"tokenUri"`
	Metadata map[string]interface{} `json:"metadata"` // Using map to handle arbitrary metadata
}

// Response represents the structure that DigitalOcean Functions expect
type Response struct {
	StatusCode string            `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

// Main is the function handler for DigitalOcean Functions
func Main(ctx context.Context, event Event) Response {
	// Get the chain parameter from the query string

	// Validate the chain parameter
	chain := event.Chain
	if chain != "testnet" && chain != "base" {
		return Response{
			Body:       "{\"error\": \"Invalid chain parameter. Must be 'testnet' or 'base'.\"}",
			StatusCode: "500",
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}
	}
	apiKey := os.Getenv("ALCHEMY_KEY")
	if apiKey == "" {
		return Response{
			Body:       "{\"error\": \"ALCHEMY_KEY environment variable is not set\"}",
			StatusCode: "500",
		}
	}
	// Determine the URL based on the chain parameter
	var url string
	if chain != "testnet" {
		// chain == "base"
		url = fmt.Sprintf("https://base-mainnet.g.alchemy.com/nft/v3/%s/getNFTsForContract?contractAddress=0x09d48fc5625c52C261b567724B160D562BC584CF&withMetadata=true", apiKey)
	} else {
		// chain == "testnet"
		url = fmt.Sprintf("https://base-sepolia.g.alchemy.com/nft/v3/%s/getNFTsForContract?contractAddress=0x09d48fc5625c52C261b567724B160D562BC584CF&withMetadata=true", apiKey)
	}

	// Fetch data from Alchemy
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return Response{
			Body:       "Error creating request",
			StatusCode: "500",
		}
	}

	// Create HTTP client and send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return Response{
			Body:       "{\"error\": \"Error fetching data from Alchemy\"}",
			StatusCode: "500",
		}
	}
	defer resp.Body.Close()

	// Check for unsuccessful status codes
	if resp.StatusCode != http.StatusOK {
		return Response{
			Body:       "{\"error\": \"Error, Alchemy returned a non-200 status code\"}",
			StatusCode: "500",
		}
	}

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return Response{
			Body:       "{\"error\": \"Error reading response body from Alchemy\"}",
			StatusCode: "500",
		}
	}

	// Parse the response
	var alchemyResp AlchemyResponse
	if err := json.Unmarshal(body, &alchemyResp); err != nil {
		return Response{
			Body:       "{\"error\": \"Error parsing OpenSea response\"}",
			StatusCode: "500",
		}
	}

	var metadataErrors []string
	// Process each NFT metadata
	var metadata []interface{}
	for _, nft := range alchemyResp.NFTs {
		// Extract metadata from the raw field
		if nft.Raw.Metadata == nil {
			metadataErrors = append(metadataErrors, fmt.Sprintf("NFT %s has no metadata", nft.TokenID))
			continue // Skip if metadata is missing
		}

		metadata = append(metadata, nft.Raw.Metadata)
	}
	// If we have errors, return them
	if len(metadataErrors) > 0 {
		fmt.Println("Metadata processing errors:", metadataErrors)
		return createErrorResponse(metadataErrors)
	}
	// Return the successful response with metadata
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return Response{
			Body:       "{\"error\": \"Error converting metadata to JSON string\"}",
			StatusCode: "500",
		}
	}

	return Response{
		StatusCode: "200",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(metadataJSON),
	}
}

// ErrorResponse represents an error response structure
type ErrorResponse struct {
	Errors []string `json:"errors"`
}

// Helper function to create error response
func createErrorResponse(errors []string) Response {
	errorResp := ErrorResponse{
		Errors: errors,
	}

	// Marshal error response to JSON
	jsonBody, err := json.Marshal(errorResp)
	if err != nil {
		// If marshaling fails, return a simple error
		return Response{
			Body:       "{\"success\": false, \"errors\": [\"Error creating error response\"]}",
			StatusCode: "500",
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}
	}

	return Response{
		Body:       string(jsonBody),
		StatusCode: "500",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}
