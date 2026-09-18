package mockapi

import (
	"net/http"
	"time"
)

// Static insight stubs so USE_MOCK=true frontends can exercise the
// insight actions without a real srcinsight binary.
func (s *Store) handleInsightEnsure(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	writeJSON(w, r, http.StatusOK, map[string]any{
		"workspaceId": wsID,
		"enabled":     true,
		"running":     true,
		"projectPath": "/mock",
	})
}

func (s *Store) handleInsightStatus(w http.ResponseWriter, r *http.Request) {
	s.handleInsightEnsure(w, r)
}

func (s *Store) handleInsightStop(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	writeJSON(w, r, http.StatusOK, map[string]any{"workspaceId": wsID, "stopped": true})
}

func (s *Store) handleInsightSync(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusAccepted, map[string]any{
		"accepted": true,
		"force":    false,
		"at":       time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Store) handleInsightSearch(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("query")
	writeJSON(w, r, http.StatusOK, map[string]any{
		"query": q,
		"hits":  []any{},
		"stats": map[string]any{"filesScanned": 0, "functionsIndexed": 0, "nodesReturned": 0},
	})
}

func (s *Store) handleInsightEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("data: {\"method\":\"sync/done\",\"params\":{}}\n\n"))
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}
