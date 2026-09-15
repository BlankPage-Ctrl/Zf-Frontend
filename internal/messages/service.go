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
