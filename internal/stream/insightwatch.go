package stream

import (
	"context"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	"myproject/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// InsightWatchService drains GET /workspaces/:id/insight/events (SSE) and
// re-emits each notification payload to the frontend via Wails events.
// Payloads are the raw InsightNotification JSON:
// {"method":"sync/start"|"sync/done"|"incrementalUpdate/start"|"incrementalUpdate/done","params":{...}}.
type InsightWatchService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeWatches map[string]context.CancelFunc
}

func NewInsightWatchService(c *client.Client) *InsightWatchService {
	return &InsightWatchService{
		c:             c,
		activeWatches: make(map[string]context.CancelFunc),
	}
}

func (s *InsightWatchService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *InsightWatchService) StartWatch(workspaceID string) (string, error) {
	streamID := fmt.Sprintf("iw-%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeWatches[streamID] = cancel
	s.mu.Unlock()

	go s.watchLoop(ctx, streamID, workspaceID)
	return streamID, nil
}

func (s *InsightWatchService) watchLoop(ctx context.Context, streamID, workspaceID string) {
	defer func() {
		s.mu.Lock()
		delete(s.activeWatches, streamID)
		s.mu.Unlock()
	}()

	backoff := watchReconnectInitial
	for {
		if ctx.Err() != nil {
			return
		}

		err := s.watchOnce(ctx, streamID, workspaceID)
		if err == nil || ctx.Err() != nil {
			return
		}

		runtime.EventsEmit(s.appCtx, "insight:watch-error", streamID, err.Error())

		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff *= 2
		if backoff > watchReconnectMax {
			backoff = watchReconnectMax
		}
	}
}

func (s *InsightWatchService) watchOnce(ctx context.Context, streamID, workspaceID string) error {
	sr, err := s.c.OpenStream("GET", "/workspaces/"+workspaceID+"/insight/events", nil, nil)
	if err != nil {
		return err
	}

	stop := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			_ = sr.Close()
		case <-stop:
		}
	}()
	defer close(stop)
	defer sr.Close()

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		event, err := sr.ReadEvent()
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			if errors.Is(err, io.EOF) {
				return fmt.Errorf("insight watch stream ended")
			}
			return fmt.Errorf("insight watch stream ended: %w", err)
		}

		runtime.EventsEmit(s.appCtx, "insight:watch-event", streamID, string(event))
	}
}

func (s *InsightWatchService) StopWatch(streamID string) error {
	s.mu.Lock()
	cancel, ok := s.activeWatches[streamID]
	delete(s.activeWatches, streamID)
	s.mu.Unlock()
	if !ok {
		return fmt.Errorf("unknown stream: %s", streamID)
	}
	cancel()
	return nil
}
