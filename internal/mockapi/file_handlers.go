package mockapi

import (
	"fmt"
	"net/http"
)

func (s *Store) handleListDir(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "."
	}
	nodes := s.listDirNodes(path)
	if nodes == nil {
		writeError(w, http.StatusNotFound, "Path not found: "+path)
		return
	}
	writeJSON(w, http.StatusOK, ListDirData{RequestedPath: path, Nodes: nodes})
}

func (s *Store) handleGetStat(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "."
	}
	node := s.statNode(path)
	if node == nil {
		writeError(w, http.StatusNotFound, "Path not found: "+path)
		return
	}
	writeJSON(w, http.StatusOK, GetStatData{Node: *node})
}

func (s *Store) handleReadFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	maxBytes := 100000
	if s := r.URL.Query().Get("maxBytes"); s != "" {
		var n int
		if _, err := fmt.Sscanf(s, "%d", &n); err == nil {
			maxBytes = n
		}
	}
	data := s.readFileContent(path, maxBytes)
	if data == nil {
		writeError(w, http.StatusNotFound, "Path not found: "+path)
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func (s *Store) handleFileEvents(w http.ResponseWriter, r *http.Request) {
	streamFileEventsSSE(w, r, s.FileTree)
}
