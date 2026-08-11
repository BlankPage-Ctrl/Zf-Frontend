package messages

import "myproject/internal/client"

type UIMessage struct {
	ID      string        `json:"id"`
	Role    string        `json:"role"`
	Content string        `json:"content"`
	Parts   []UIMessagePart `json:"parts,omitempty"`
}

type UIMessagePart struct {
	Type             string      `json:"type"`
	Text             string      `json:"text,omitempty"`
	Content          string      `json:"content,omitempty"`
	State            string      `json:"state,omitempty"`
	ToolCallId       string      `json:"toolCallId,omitempty"`
	Input            interface{} `json:"input,omitempty"`
	Output           interface{} `json:"output,omitempty"`
	ErrorText        string      `json:"errorText,omitempty"`
	ProviderExecuted *bool       `json:"providerExecuted,omitempty"`
	SourceId         string      `json:"sourceId,omitempty"`
	Url              string      `json:"url,omitempty"`
	Title            string      `json:"title,omitempty"`
	MediaType        string      `json:"mediaType,omitempty"`
	Filename         string      `json:"filename,omitempty"`
	Data             interface{} `json:"data,omitempty"`
	Id               string      `json:"id,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) LoadHistory(workspaceID, chatID string) ([]UIMessage, error) {
	return client.DoOK[[]UIMessage](s.c, "GET", "/workspaces/"+workspaceID+"/chats/"+chatID+"/messages", nil, nil)
}
