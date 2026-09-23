package messages

import (
	"encoding/json"

	"myproject/internal/client"
)

// FeedEvent mirrors the backend custom chat-feed wire event
// (apps/shared/chat-feed FeedWireEvent / FeedHistoryEvent).
// The payload shape varies per `type` (text-open, work-ok, asset, ...),
// so the full raw object is preserved; the frontend reducer interprets it.
type FeedEvent map[string]any

// Type returns the feed event name (e.g. "text-delta", "run-close").
func (e FeedEvent) Type() string {
	t, _ := e["type"].(string)
	return t
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) LoadHistory(workspaceID, chatID string) ([]FeedEvent, error) {
	raw, err := client.DoOK[[]json.RawMessage](s.c, "GET", "/workspaces/"+workspaceID+"/chats/"+chatID+"/messages", nil, nil)
	if err != nil {
		return nil, err
	}
	events := make([]FeedEvent, 0, len(raw))
	for _, r := range raw {
		var e FeedEvent
		if err := json.Unmarshal(r, &e); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

// RevertResult mirrors the backend revert.message-run result JSON shape.
type RevertResult struct {
	DeletedMessageIDs []string `json:"deletedMessageIds"`
	CancelledRunIDs   []string `json:"cancelledRunIds"`
}

// RevertMessages cancels running runs in the chat and deletes the target
// user message plus all messages after it (conversation-only revert).
func (s *Service) RevertMessages(workspaceID, chatID, messageID string) (RevertResult, error) {
	body := map[string]any{"messageId": messageID, "mode": "conversation"}
	return client.DoOK[RevertResult](s.c, "POST", "/workspaces/"+workspaceID+"/chats/"+chatID+"/revert", body, nil)
}
