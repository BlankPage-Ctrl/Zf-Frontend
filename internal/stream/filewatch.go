package stream

import (
	"bufio"
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"myproject/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileWatchService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeWatches map[string]context.CancelFunc
}

func NewFileWatchService(c *client.Client) *FileWatchService {
	return &FileWatchService{
		c:             c,
		activeWatches: make(map[string]context.CancelFunc),
	}
}

func (s *FileWatchService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *FileWatchService) StartWatch(workspaceID string) (string, error) {
	streamID := fmt.Sprintf("fw-%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeWatches[streamID] = cancel
	s.mu.Unlock()

	go s.watchLoop(ctx, streamID, workspaceID, cancel)
	return streamID, nil
}

func (s *FileWatchService) watchLoop(ctx context.Context, streamID, workspaceID string, cancel context.CancelFunc) {
	defer func() {
		s.mu.Lock()
		delete(s.activeWatches, streamID)
		s.mu.Unlock()
		cancel()
	}()

	resp, err := s.c.Do("GET", "/workspaces/"+workspaceID+"/files/events", nil, nil)
	if err != nil {
		runtime.EventsEmit(s.appCtx, "file:watch-error", streamID, err.Error())
		return
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		select {
		case <-ctx.Done():
			return
		default:
		}
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			runtime.EventsEmit(s.appCtx, "file:watch-event", streamID, data)
		}
	}
	if err := scanner.Err(); err != nil {
		runtime.EventsEmit(s.appCtx, "file:watch-error", streamID, err.Error())
	}
}

func (s *FileWatchService) StopWatch(streamID string) error {
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
