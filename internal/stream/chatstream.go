package stream

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"strings"
	"sync"

	"myproject/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ChatStreamService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeStreams map[string]context.CancelFunc
}

func NewChatStreamService(c *client.Client) *ChatStreamService {
	return &ChatStreamService{
		c:             c,
		activeStreams: make(map[string]context.CancelFunc),
	}
}

func (s *ChatStreamService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *ChatStreamService) StartStream(streamID, workspaceID, chatID, bodyJSON string) {
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeStreams[streamID] = cancel
	s.mu.Unlock()

	go s.streamLoop(ctx, streamID, workspaceID, chatID, bodyJSON)
}

func (s *ChatStreamService) streamLoop(ctx context.Context, streamID, workspaceID, chatID, bodyJSON string) {
	defer func() {
		s.mu.Lock()
		delete(s.activeStreams, streamID)
		s.mu.Unlock()
	}()

	resp, err := s.c.DoStream("POST", "/workspaces/"+workspaceID+"/chats/"+chatID+"/messages", json.RawMessage(bodyJSON), nil)
	if err != nil {
		runtime.EventsEmit(s.appCtx, "chat:stream-error", streamID, err.Error())
		return
	}
	defer resp.Body.Close()

	reader := bufio.NewReader(resp.Body)
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				runtime.EventsEmit(s.appCtx, "chat:stream-done", streamID)
				return
			}
			runtime.EventsEmit(s.appCtx, "chat:stream-error", streamID, err.Error())
			return
		}

		line = strings.TrimSuffix(line, "\n")
		line = strings.TrimSuffix(line, "\r")
		runtime.EventsEmit(s.appCtx, "chat:stream-chunk", streamID, line)
	}
}

func (s *ChatStreamService) CancelStream(streamID string) {
	s.mu.Lock()
	cancel, ok := s.activeStreams[streamID]
	delete(s.activeStreams, streamID)
	s.mu.Unlock()
	if ok {
		cancel()
	}
}
