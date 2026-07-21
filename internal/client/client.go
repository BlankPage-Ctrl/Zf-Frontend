package client

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

const DefaultBaseURL = "http://localhost:3000"
const DefaultClientID = "dev-client"
const DefaultSecretKey = "dev-secret-key"

type Client struct {
	BaseURL   string
	ClientID  string
	SecretKey string
	HTTP      *http.Client
}

func New() *Client {
	return &Client{
		BaseURL:   DefaultBaseURL,
		ClientID:  DefaultClientID,
		SecretKey: DefaultSecretKey,
		HTTP:      &http.Client{Timeout: 30 * time.Second},
	}
}

func sortQueryString(qs string) string {
	if qs == "" {
		return ""
	}
	parts := strings.Split(qs, "&")
	sort.Strings(parts)
	return strings.Join(parts, ",")
}

func (c *Client) buildAuthHeaders(method, path, queryString, body string) map[string]string {
	ts := strconv.FormatInt(time.Now().Unix(), 10)

	canonicalPath := path
	if !strings.HasPrefix(canonicalPath, "/") {
		canonicalPath = "/" + canonicalPath
	}

	bodyHash := sha256Hex(body)
	sortedQuery := sortQueryString(queryString)

	canonical := strings.Join([]string{
		strings.ToUpper(method),
		canonicalPath,
		sortedQuery,
		ts,
		bodyHash,
	}, "\n")

	stringToSign := "HMAC-SHA256\n" + sha256Hex(canonical)
	signature := hmacSha256Hex(c.SecretKey, stringToSign)

	return map[string]string{
		"X-Client-Id":  c.ClientID,
		"X-Timestamp":  ts,
		"X-Signature":  "HMAC-SHA256=" + signature,
	}
}

func sha256Hex(data string) string {
	h := sha256.Sum256([]byte(data))
	return hex.EncodeToString(h[:])
}

func hmacSha256Hex(secret, data string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}

func (c *Client) Do(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	u, err := url.Parse(c.BaseURL + path)
	if err != nil {
		return nil, fmt.Errorf("invalid url: %w", err)
	}

	q := u.Query()
	for k, v := range queryParams {
		q.Set(k, v)
	}
	u.RawQuery = q.Encode()

	var bodyReader io.Reader
	var bodyStr string
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal body: %w", err)
		}
		bodyStr = string(b)
		bodyReader = bytes.NewReader(b)
	}

	headers := c.buildAuthHeaders(method, u.Path, u.RawQuery, bodyStr)

	req, err := http.NewRequest(method, u.String(), bodyReader)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	return c.HTTP.Do(req)
}

func DoOK[T any](c *Client, method, path string, body any, queryParams map[string]string) (T, error) {
	var zero T
	resp, err := c.Do(method, path, body, queryParams)
	if err != nil {
		return zero, fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, fmt.Errorf("read body: %w", err)
	}

	if resp.StatusCode == http.StatusNoContent {
		return zero, nil
	}

	if resp.StatusCode >= 400 {
		var errResp struct {
			Error string `json:"error"`
		}
		if json.Unmarshal(raw, &errResp) == nil && errResp.Error != "" {
			return zero, fmt.Errorf("api error (%d): %s", resp.StatusCode, errResp.Error)
		}
		return zero, fmt.Errorf("request failed (%d): %s", resp.StatusCode, string(raw))
	}

	if len(raw) == 0 {
		return zero, nil
	}

	var result T
	if err := json.Unmarshal(raw, &result); err != nil {
		return zero, fmt.Errorf("unmarshal: %w", err)
	}
	return result, nil
}

func DoVoid(c *Client, method, path string, body any) error {
	resp, err := c.Do(method, path, body, nil)
	if err != nil {
		return fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("request failed (%d): %s", resp.StatusCode, string(raw))
	}
	return nil
}
