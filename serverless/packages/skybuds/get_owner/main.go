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
	Chain   string `json:"chain"`
	TokenId string `json:"tokenId"`
}

type OwnerResponse struct {
	Owners []string `json:"owners"`
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
	// Validate the tokenId parameter
	tokenId := event.TokenId

	if tokenId == "" {
		return Response{
			Body:       "{\"error\": \"Invalid tokenId parameter.\"}",
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
		url = fmt.Sprintf("https://base-mainnet.g.alchemy.com/nft/v3/%s/getOwnersForNFT?contractAddress=0x09d48fc5625c52C261b567724B160D562BC584CF&tokenId=%s", apiKey, tokenId)
	} else {
		// chain == "testnet"
		url = fmt.Sprintf("https://base-sepolia.g.alchemy.com/nft/v3/%s/getOwnersForNFT?contractAddress=0x09d48fc5625c52C261b567724B160D562BC584CF&tokenId=%s", apiKey, tokenId)
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
	var alchemyResp OwnerResponse
	if err := json.Unmarshal(body, &alchemyResp); err != nil {
		return Response{
			Body:       "{\"error\": \"Error parsing OpenSea response\"}",
			StatusCode: "500",
		}
	}

	return Response{
		StatusCode: "200",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: fmt.Sprintf("{\"owner\": \"%s\"}", alchemyResp.Owners[0]),
	}
}

// ErrorResponse represents an error response structure
type ErrorResponse struct {
	Errors []string `json:"errors"`
}
