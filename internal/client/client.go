package client

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

const DefaultBaseURL = "http://localhost:4567"
const DefaultClientID = "default-client"
const DefaultSecretKey = "default-01KY288BNYMXFXEK5GF3N82MT8"

const RequestIDHeader = "X-Request-Id"

type Client struct {
	BaseURL   string
	ClientID  string
	SecretKey string
	HTTP      *http.Client
	Stream    *http.Client
}

func New() *Client {
	baseURL := os.Getenv("BACKEND_URL")
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	return &Client{
		BaseURL:   baseURL,
		ClientID:  DefaultClientID,
		SecretKey: DefaultSecretKey,
		HTTP:      &http.Client{Timeout: 30 * time.Second},
		Stream:    &http.Client{},
	}
}

type Envelope struct {
	RequestID  string          `json:"requestId"`
	ResponseID string          `json:"responseId"`
	Status     int             `json:"status"`
	Timestamp  string          `json:"timestamp"`
	Data       json.RawMessage `json:"data"`
	Error      *APIError       `json:"error"`
}

type APIError struct {
	Code       string          `json:"code"`
	Message    string          `json:"message"`
	Issues     json.RawMessage `json:"issues,omitempty"`
	Status     int             `json:"-"`
	RequestID  string          `json:"-"`
	ResponseID string          `json:"-"`
}

func (e *APIError) Error() string {
	if e == nil {
		return "api error"
	}
	msg := e.Message
	if msg == "" {
		msg = "request failed"
	}
	if e.Code == "" {
		return fmt.Sprintf("request failed (%d) requestId=%s: %s", e.Status, e.RequestID, msg)
	}
	return fmt.Sprintf("request failed (%d) [%s] requestId=%s: %s", e.Status, e.Code, e.RequestID, msg)
}

func newRequestID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "req-" + strconv.FormatInt(time.Now().UnixNano(), 16)
	}
	return "req-" + hex.EncodeToString(b[:])
}

func sortQueryString(qs string) string {
	if qs == "" {
		return ""
	}
	parts := strings.Split(qs, "&")
	sort.Strings(parts)
	return strings.Join(parts, "&")
}

func buildCanonical(method, path, queryString, timestamp, requestID, body string) string {
	canonicalPath := path
	if !strings.HasPrefix(canonicalPath, "/") {
		canonicalPath = "/" + canonicalPath
	}

	bodyHash := sha256Hex(body)
	sortedQuery := sortQueryString(queryString)

	return strings.Join([]string{
		strings.ToUpper(method),
		canonicalPath,
		sortedQuery,
		timestamp,
		requestID,
		bodyHash,
	}, "\n")
}

func (c *Client) buildAuthHeaders(method, path, queryString, body, requestID string) map[string]string {
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	canonical := buildCanonical(method, path, queryString, ts, requestID, body)

	stringToSign := "HMAC-SHA256\n" + sha256Hex(canonical)
	signature := hmacSha256Hex(c.SecretKey, stringToSign)

	return map[string]string{
		"X-Client-Id":  c.ClientID,
		"X-Timestamp":  ts,
		"X-Request-Id": requestID,
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
	return c.do(c.HTTP, method, path, body, queryParams)
}

func (c *Client) DoStream(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return c.do(c.Stream, method, path, body, queryParams)
}

func (c *Client) do(httpClient *http.Client, method, path string, body any, queryParams map[string]string) (*http.Response, error) {
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

	requestID := newRequestID()
	headers := c.buildAuthHeaders(method, u.Path, u.RawQuery, bodyStr, requestID)

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

	return httpClient.Do(req)
}

func toAPIError(raw []byte, status int, env *Envelope) error {
	if env != nil && env.Error != nil {
		e := env.Error
		e.Status = status
		e.RequestID = env.RequestID
		e.ResponseID = env.ResponseID
		return e
	}

	msg := string(raw)
	var legacy struct {
		Error string `json:"error"`
	}
	if json.Unmarshal(raw, &legacy) == nil && legacy.Error != "" {
		msg = legacy.Error
	}
	reqID := ""
	if env != nil {
		reqID = env.RequestID
	}
	return &APIError{
		Status:    status,
		Message:   msg,
		RequestID: reqID,
	}
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

	var env Envelope
	hasEnvelope := json.Unmarshal(raw, &env) == nil &&
		(env.Data != nil || env.Error != nil)

	if resp.StatusCode >= 400 {
		return zero, toAPIError(raw, resp.StatusCode, &env)
	}

	if len(raw) == 0 {
		return zero, nil
	}

	if !hasEnvelope {
		var result T
		if err := json.Unmarshal(raw, &result); err != nil {
			return zero, fmt.Errorf("unmarshal: %w", err)
		}
		return result, nil
	}

	if env.Error != nil {
		return zero, toAPIError(raw, resp.StatusCode, &env)
	}

	if len(env.Data) == 0 || bytes.Equal(env.Data, []byte("null")) {
		return zero, nil
	}

	var result T
	if err := json.Unmarshal(env.Data, &result); err != nil {
		return zero, fmt.Errorf("unmarshal envelope data: %w", err)
	}
	return result, nil
}

func DoVoid(c *Client, method, path string, body any) error {
	resp, err := c.Do(method, path, body, nil)
	if err != nil {
		return fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 400 {
		return nil
	}

	raw, _ := io.ReadAll(resp.Body)
	var env Envelope
	_ = json.Unmarshal(raw, &env)
	return toAPIError(raw, resp.StatusCode, &env)
}
