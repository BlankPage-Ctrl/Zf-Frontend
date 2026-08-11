package mockapi

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type mockMessage struct {
	ID    string     `json:"id"`
	Role  string     `json:"role"`
	Parts []mockPart `json:"parts"`
}

type mockPart struct {
	Type       string      `json:"type"`
	Text       string      `json:"text,omitempty"`
	State      string      `json:"state,omitempty"`
	ToolCallID string      `json:"toolCallId,omitempty"`
	Input      interface{} `json:"input,omitempty"`
	Output     interface{} `json:"output,omitempty"`
	Content    string      `json:"content,omitempty"`
}

func writeSSE(w http.ResponseWriter, data map[string]interface{}) {
	b, _ := json.Marshal(data)
	fmt.Fprintf(w, "data: %s\n\n", b)
}

func streamMessageSSE(w http.ResponseWriter, r *http.Request, msg mockMessage) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, r, http.StatusInternalServerError, "streaming not supported")
		return
	}

	sendEvent := func(obj map[string]interface{}) {
		writeSSE(w, obj)
		flusher.Flush()
	}

	msgID := fmt.Sprintf("msg_%s", newID())
	sendEvent(map[string]interface{}{"type": "start", "messageId": msgID})
	sendEvent(map[string]interface{}{"type": "start-step"})

	textIdx := 0
	reasoningIdx := 0

	for _, part := range msg.Parts {
		switch part.Type {
		case "step-start":
			continue

		case "reasoning":
			reasoningIdx++
			id := fmt.Sprintf("reasoning-%d", reasoningIdx)
			sendEvent(map[string]interface{}{"type": "reasoning-start", "id": id})
			sendEvent(map[string]interface{}{"type": "reasoning-delta", "id": id, "delta": part.Text})
			sendEvent(map[string]interface{}{"type": "reasoning-end", "id": id})

		case "text":
			textIdx++
			id := fmt.Sprintf("text-%d", textIdx)
			sendEvent(map[string]interface{}{"type": "text-start", "id": id})
			sendEvent(map[string]interface{}{"type": "text-delta", "id": id, "delta": part.Text})
			sendEvent(map[string]interface{}{"type": "text-end", "id": id})

		default:
			if len(part.Type) > 5 && part.Type[:5] == "tool-" {
				toolName := part.Type[5:]
				sendEvent(map[string]interface{}{
					"type":       "tool-input-start",
					"toolCallId": part.ToolCallID,
					"toolName":   toolName,
				})
				if part.Input != nil {
					sendEvent(map[string]interface{}{
						"type":       "tool-input-available",
						"toolCallId": part.ToolCallID,
						"toolName":   toolName,
						"input":      part.Input,
					})
				}
				if part.Output != nil {
					sendEvent(map[string]interface{}{
						"type":       "tool-output-available",
						"toolCallId": part.ToolCallID,
						"output":     part.Output,
					})
				}
			}
		}
	}

	sendEvent(map[string]interface{}{"type": "finish-step"})
	sendEvent(map[string]interface{}{"type": "finish", "finishReason": "stop"})
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

type sseFileEvent struct {
	Type      string      `json:"type"`
	Timestamp int64       `json:"timestamp"`
	Node      interface{} `json:"node"`
	OldPath   string      `json:"oldPath,omitempty"`
}

func streamFileEventsSSE(w http.ResponseWriter, r *http.Request, root FileNode) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, r, http.StatusInternalServerError, "streaming not supported")
		return
	}

	ctx := r.Context()

	var leafNodes []FileNode
	var collectLeaves func(n FileNode)
	collectLeaves = func(n FileNode) {
		if !n.IsDirectory {
			leafNodes = append(leafNodes, n)
		}
		for _, c := range n.Children {
			collectLeaves(c)
		}
	}
	collectLeaves(root)

	if len(leafNodes) == 0 {
		return
	}

	ticker := time.NewTicker(8 * time.Second)
	defer ticker.Stop()

	eventTypes := []string{"MODIFIED", "CREATED", "DELETED", "MOVED"}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			et := eventTypes[rand.Intn(len(eventTypes))]
			file := leafNodes[rand.Intn(len(leafNodes))]

			var evt sseFileEvent
			evt.Type = et
			evt.Timestamp = time.Now().UnixMilli()

			switch et {
			case "MODIFIED":
				evt.Node = file
			case "CREATED":
				evt.Node = map[string]interface{}{
					"id":           newID(),
					"name":         "new-" + file.Name,
					"path":         file.Path + ".new",
					"type":         "file",
					"isDirectory":  false,
					"size":         rand.Int63n(5000),
					"lastModified": time.Now().UnixMilli(),
				}
			case "DELETED":
				evt.Node = map[string]interface{}{
					"id":          file.ID,
					"name":        file.Name,
					"path":        file.Path,
					"type":        file.Type,
					"isDirectory": false,
				}
			case "MOVED":
				newName := "moved-" + file.Name
				evt.Node = map[string]interface{}{
					"id":           file.ID,
					"name":         newName,
					"path":         file.Path,
					"type":         file.Type,
					"isDirectory":  false,
					"size":         file.Size,
					"lastModified": file.LastModified,
				}
				evt.OldPath = file.Path
			}

			b, _ := json.Marshal(evt)
			fmt.Fprintf(w, "data: %s\n\n", b)
			flusher.Flush()
		}
	}
}
