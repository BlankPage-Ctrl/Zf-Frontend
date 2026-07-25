package mockapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func writeNoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func (s *Store) NewHandler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /workspaces", s.handleListWorkspaces)
	mux.HandleFunc("GET /workspaces/{id}", s.handleGetWorkspace)
	mux.HandleFunc("POST /workspaces", s.handleCreateWorkspace)
	mux.HandleFunc("PATCH /workspaces/{id}", s.handleUpdateWorkspace)
	mux.HandleFunc("DELETE /workspaces/{id}", s.handleDeleteWorkspace)

	mux.HandleFunc("GET /workspaces/{workspaceId}/chats", s.handleListChats)
	mux.HandleFunc("GET /workspaces/{workspaceId}/chats/{id}", s.handleGetChat)
	mux.HandleFunc("POST /workspaces/{workspaceId}/chats", s.handleCreateChat)
	mux.HandleFunc("PATCH /workspaces/{workspaceId}/chats/{id}", s.handleUpdateChat)
	mux.HandleFunc("DELETE /workspaces/{workspaceId}/chats/{id}", s.handleDeleteChat)

	mux.HandleFunc("GET /workspaces/{workspaceId}/chats/{chatId}/messages", s.handleGetMessages)
	mux.HandleFunc("POST /workspaces/{workspaceId}/chats/{chatId}/messages", s.handlePostMessage)

	mux.HandleFunc("GET /workspaces/{workspaceId}/files", s.handleListDir)
	mux.HandleFunc("GET /workspaces/{workspaceId}/files/stat", s.handleGetStat)
	mux.HandleFunc("GET /workspaces/{workspaceId}/files/read", s.handleReadFile)
	mux.HandleFunc("GET /workspaces/{workspaceId}/files/events", s.handleFileEvents)

	mux.HandleFunc("GET /providers", s.handleListProviders)
	mux.HandleFunc("GET /providers/{id}", s.handleGetProvider)
	mux.HandleFunc("POST /providers", s.handleCreateProvider)
	mux.HandleFunc("PATCH /providers/{id}", s.handleUpdateProvider)
	mux.HandleFunc("DELETE /providers/{id}", s.handleDeleteProvider)

	mux.HandleFunc("GET /providers/{providerId}/models", s.handleListModels)
	mux.HandleFunc("POST /providers/{providerId}/models", s.handleCreateModel)
	mux.HandleFunc("PATCH /providers/{providerId}/models/{id}", s.handleUpdateModel)
	mux.HandleFunc("DELETE /providers/{providerId}/models/{id}", s.handleDeleteModel)

	mux.HandleFunc("GET /notes", s.handleListNotes)
	mux.HandleFunc("GET /notes/{id}", s.handleGetNote)
	mux.HandleFunc("POST /notes", s.handleCreateNote)
	mux.HandleFunc("PATCH /notes/{id}", s.handleUpdateNote)
	mux.HandleFunc("DELETE /notes/{id}", s.handleDeleteNote)
	mux.HandleFunc("POST /notes/{id}/move", s.handleMoveNote)
	mux.HandleFunc("POST /notes-renumber", s.handleRenumberNotes)

	mux.HandleFunc("GET /categories", s.handleListCategories)
	mux.HandleFunc("POST /categories", s.handleCreateCategory)
	mux.HandleFunc("PATCH /categories/{id}", s.handleRenameCategory)
	mux.HandleFunc("DELETE /categories/{id}", s.handleDeleteCategory)

	mux.HandleFunc("GET /settings/default-provider", s.handleGetDefaultProvider)
	mux.HandleFunc("PUT /settings/default-provider", s.handleSetDefaultProvider)
	mux.HandleFunc("GET /settings/{key}", s.handleGetSetting)
	mux.HandleFunc("PUT /settings/{key}", s.handleSetSetting)

	return mux
}

func readBody(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

// ── Workspaces ──

func (s *Store) handleListWorkspaces(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.Workspaces.All())
}

func (s *Store) handleGetWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ws, ok := s.Workspaces.Find(func(w Workspace) bool { return w.ID == id })
	if !ok {
		writeError(w, http.StatusNotFound, "Workspace "+id+" not found")
		return
	}
	writeJSON(w, http.StatusOK, ws)
}

func (s *Store) handleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name        string  `json:"name"`
		Description *string `json:"description"`
		ProjectPath string  `json:"projectPath"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	ws := Workspace{
		ID:          newID(),
		Name:        body.Name,
		Description: body.Description,
		ProjectPath: body.ProjectPath,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.Workspaces.Add(ws)
	writeJSON(w, http.StatusCreated, ws)
}

func (s *Store) handleUpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Workspaces.Update(func(w Workspace) bool { return w.ID == id }, func(ws *Workspace) {
		if v, ok := body["name"].(string); ok {
			ws.Name = v
		}
		if v, ok := body["description"].(string); ok {
			ws.Description = &v
		}
		if v, ok := body["projectPath"].(string); ok {
			ws.ProjectPath = v
		}
		ws.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, http.StatusNotFound, "Workspace "+id+" not found")
		return
	}
	ws, _ := s.Workspaces.Find(func(w Workspace) bool { return w.ID == id })
	writeJSON(w, http.StatusOK, ws)
}

func (s *Store) handleDeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Workspaces.Remove(func(w Workspace) bool { return w.ID == id }) {
		writeError(w, http.StatusNotFound, "Workspace "+id+" not found")
		return
	}
	writeNoContent(w)
}

// ── Chats ──

func (s *Store) handleListChats(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chats := s.Chats.Filter(func(c Chat) bool { return c.WorkspaceID == wsID })
	writeJSON(w, http.StatusOK, chats)
}

func (s *Store) handleGetChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	id := r.PathValue("id")
	chat, ok := s.Chats.Find(func(c Chat) bool { return c.ID == id })
	if !ok || chat.WorkspaceID != wsID {
		writeError(w, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	writeJSON(w, http.StatusOK, chat)
}

func (s *Store) handleCreateChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	var body struct {
		Title        string  `json:"title"`
		ProviderID   *string `json:"providerId"`
		ModelID      *string `json:"modelId"`
		SystemPrompt *string `json:"systemPrompt"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	chat := Chat{
		ID:           newID(),
		Title:        body.Title,
		ProviderID:   body.ProviderID,
		ModelID:      body.ModelID,
		SystemPrompt: body.SystemPrompt,
		WorkspaceID:  wsID,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	s.Chats.Add(chat)
	writeJSON(w, http.StatusCreated, chat)
}

func (s *Store) handleUpdateChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Chats.Update(func(c Chat) bool { return c.ID == id && c.WorkspaceID == wsID }, func(chat *Chat) {
		if v, ok := body["title"].(string); ok {
			chat.Title = v
		}
		if v, ok := body["providerId"].(string); ok {
			chat.ProviderID = &v
		}
		if v, ok := body["modelId"].(string); ok {
			chat.ModelID = &v
		}
		if v, ok := body["systemPrompt"].(string); ok {
			chat.SystemPrompt = &v
		}
		chat.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	chat, _ := s.Chats.Find(func(c Chat) bool { return c.ID == id })
	writeJSON(w, http.StatusOK, chat)
}

func (s *Store) handleDeleteChat(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Chats.Remove(func(c Chat) bool { return c.ID == id }) {
		writeError(w, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	writeNoContent(w)
}

// ── Messages ──

func (s *Store) handleGetMessages(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.Messages)
}

func (s *Store) handlePostMessage(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Message *struct {
			Role string `json:"role"`
		} `json:"message"`
	}
	if err := readBody(r, &body); err != nil || body.Message == nil {
		writeError(w, http.StatusBadRequest, "body.message is required")
		return
	}
	if body.Message.Role != "user" {
		writeError(w, http.StatusBadRequest, "only user messages are accepted")
		return
	}

	var assistantMsg *mockMessage
	for _, m := range s.Messages {
		if m.Role == "assistant" {
			assistantMsg = &m
			break
		}
	}
	if assistantMsg == nil {
		writeError(w, http.StatusInternalServerError, "No mock assistant message available")
		return
	}

	streamMessageSSE(w, *assistantMsg)
}

// ── Files ──

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

// ── Providers ──

func (s *Store) handleListProviders(w http.ResponseWriter, r *http.Request) {
	providers := s.Providers.All()
	result := make([]interface{}, len(providers))
	for i, p := range providers {
		result[i] = s.providerWithModels(p)
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Store) handleGetProvider(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, ok := s.Providers.Find(func(p Provider) bool { return p.ID == id })
	if !ok {
		writeError(w, http.StatusNotFound, "Provider "+id+" not found")
		return
	}
	writeJSON(w, http.StatusOK, s.providerWithModels(p))
}

func (s *Store) handleCreateProvider(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name    string  `json:"name"`
		Type    string  `json:"type"`
		APIKey  *string `json:"apiKey"`
		BaseURL *string `json:"baseURL"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	p := Provider{
		ID:        newID(),
		Name:      body.Name,
		Type:      body.Type,
		APIKey:    body.APIKey,
		BaseURL:   body.BaseURL,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.Providers.Add(p)
	writeJSON(w, http.StatusCreated, s.providerWithModels(p))
}

func (s *Store) handleUpdateProvider(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Providers.Update(func(p Provider) bool { return p.ID == id }, func(p *Provider) {
		if v, ok := body["name"].(string); ok {
			p.Name = v
		}
		if v, ok := body["type"].(string); ok {
			p.Type = v
		}
		if v, ok := body["apiKey"].(string); ok {
			p.APIKey = &v
		}
		if v, ok := body["baseURL"].(string); ok {
			p.BaseURL = &v
		}
		p.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, http.StatusNotFound, "Provider "+id+" not found")
		return
	}
	p, _ := s.Providers.Find(func(p Provider) bool { return p.ID == id })
	writeJSON(w, http.StatusOK, s.providerWithModels(p))
}

func (s *Store) handleDeleteProvider(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Providers.Remove(func(p Provider) bool { return p.ID == id }) {
		writeError(w, http.StatusNotFound, "Provider "+id+" not found")
		return
	}
	writeNoContent(w)
}

// ── Models ──

func (s *Store) handleListModels(w http.ResponseWriter, r *http.Request) {
	pvID := r.PathValue("providerId")
	models := s.Models.Filter(func(m ProviderModel) bool { return m.ProviderID == pvID })
	writeJSON(w, http.StatusOK, models)
}

func (s *Store) handleCreateModel(w http.ResponseWriter, r *http.Request) {
	pvID := r.PathValue("providerId")
	var body struct {
		ModelID     string  `json:"modelId"`
		DisplayName *string `json:"displayName"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	m := ProviderModel{
		ID:          newID(),
		ModelID:     body.ModelID,
		DisplayName: body.DisplayName,
		ProviderID:  pvID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.Models.Add(m)
	writeJSON(w, http.StatusCreated, m)
}

func (s *Store) handleUpdateModel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Models.Update(func(m ProviderModel) bool { return m.ID == id }, func(m *ProviderModel) {
		if v, ok := body["modelId"].(string); ok {
			m.ModelID = v
		}
		if v, ok := body["displayName"].(string); ok {
			m.DisplayName = &v
		}
		m.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, http.StatusNotFound, "Model "+id+" not found")
		return
	}
	md, _ := s.Models.Find(func(m ProviderModel) bool { return m.ID == id })
	writeJSON(w, http.StatusOK, md)
}

func (s *Store) handleDeleteModel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Models.Remove(func(m ProviderModel) bool { return m.ID == id }) {
		writeError(w, http.StatusNotFound, "Model "+id+" not found")
		return
	}
	writeNoContent(w)
}

// ── Notes ──

func (s *Store) handleListNotes(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	notes := s.Notes.All()

	if cat := q.Get("category"); cat != "" {
		notes = s.Notes.Filter(func(n Note) bool { return n.CategoryID == cat })
	}
	if pri := q.Get("priority"); pri != "" {
		notes = s.Notes.Filter(func(n Note) bool { return n.Priority == pri })
	}
	if search := q.Get("search"); search != "" {
		search = strings.ToLower(search)
		var filtered []Note
		for _, n := range notes {
			if strings.Contains(strings.ToLower(n.Name), search) ||
				strings.Contains(strings.ToLower(n.Desc), search) ||
				strings.Contains(strings.ToLower(n.Details), search) {
				filtered = append(filtered, n)
			}
		}
		notes = filtered
	}

	switch q.Get("sort") {
	case "name":
		for i := 0; i < len(notes); i++ {
			for j := i + 1; j < len(notes); j++ {
				if notes[i].Name > notes[j].Name {
					notes[i], notes[j] = notes[j], notes[i]
				}
			}
		}
	case "priority":
		order := map[string]int{"critical": 0, "high": 1, "medium": 2, "low": 3}
		for i := 0; i < len(notes); i++ {
			for j := i + 1; j < len(notes); j++ {
				if order[notes[i].Priority] > order[notes[j].Priority] {
					notes[i], notes[j] = notes[j], notes[i]
				}
			}
		}
	default:
		for i := 0; i < len(notes); i++ {
			for j := i + 1; j < len(notes); j++ {
				if notes[i].Rank > notes[j].Rank {
					notes[i], notes[j] = notes[j], notes[i]
				}
			}
		}
	}

	if q.Get("order") == "desc" {
		for i, j := 0, len(notes)-1; i < j; i, j = i+1, j-1 {
			notes[i], notes[j] = notes[j], notes[i]
		}
	}

	offset := 0
	if o := q.Get("offset"); o != "" {
		var n int
		if _, err := fmt.Sscanf(o, "%d", &n); err == nil {
			offset = n
		}
	}
	limit := len(notes)
	if l := q.Get("limit"); l != "" {
		var n int
		if _, err := fmt.Sscanf(l, "%d", &n); err == nil && n > 0 {
			limit = offset + n
			if limit > len(notes) {
				limit = len(notes)
			}
		}
	}
	if offset > len(notes) {
		offset = len(notes)
	}

	writeJSON(w, http.StatusOK, notes[offset:limit])
}

func (s *Store) handleGetNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	note, ok := s.Notes.Find(func(n Note) bool { return n.ID == id })
	if !ok {
		writeError(w, http.StatusNotFound, "Note "+id+" not found")
		return
	}
	writeJSON(w, http.StatusOK, note)
}

func (s *Store) handleCreateNote(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name       string   `json:"name"`
		CategoryID *string  `json:"category_id"`
		Desc       *string  `json:"desc"`
		Details    *string  `json:"details"`
		Priority   *string  `json:"priority"`
		Position   struct {
			Before *string `json:"before"`
			After  *string `json:"after"`
		} `json:"position"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	note := Note{
		ID:        newID(),
		Name:      body.Name,
		Rank:      s.nextNoteRank(),
		Priority:  "medium",
		CreatedAt: now,
		UpdatedAt: now,
		Version:   1,
	}
	if body.CategoryID != nil {
		note.CategoryID = *body.CategoryID
	}
	if body.Desc != nil {
		note.Desc = *body.Desc
	}
	if body.Details != nil {
		note.Details = *body.Details
	}
	if body.Priority != nil {
		note.Priority = *body.Priority
	}
	if body.Position.Before != nil {
		if before, ok := s.Notes.Find(func(n Note) bool { return n.ID == *body.Position.Before }); ok {
			note.Rank = before.Rank
		}
	} else if body.Position.After != nil {
		if after, ok := s.Notes.Find(func(n Note) bool { return n.ID == *body.Position.After }); ok {
			note.Rank = after.Rank + "_" + s.nextNoteRank()
		}
	}
	s.Notes.Add(note)
	writeJSON(w, http.StatusCreated, note)
}

func (s *Store) handleUpdateNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Notes.Update(func(n Note) bool { return n.ID == id }, func(n *Note) {
		if v, ok := body["name"].(string); ok {
			n.Name = v
		}
		if v, ok := body["category_id"].(string); ok {
			n.CategoryID = v
		}
		if v, ok := body["desc"].(string); ok {
			n.Desc = v
		}
		if v, ok := body["details"].(string); ok {
			n.Details = v
		}
		if v, ok := body["priority"].(string); ok {
			n.Priority = v
		}
		n.Version++
		n.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, http.StatusBadRequest, "Note "+id+" not found")
		return
	}
	note, _ := s.Notes.Find(func(n Note) bool { return n.ID == id })
	writeJSON(w, http.StatusOK, note)
}

func (s *Store) handleDeleteNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	s.Notes.Remove(func(n Note) bool { return n.ID == id })
	writeNoContent(w)
}

func (s *Store) handleMoveNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body struct {
		Before *string `json:"before"`
		After  *string `json:"after"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Notes.Update(func(n Note) bool { return n.ID == id }, func(n *Note) {
		if body.Before != nil {
			if before, ok := s.Notes.Find(func(x Note) bool { return x.ID == *body.Before }); ok {
				n.Rank = before.Rank + "_before"
			}
		} else if body.After != nil {
			if after, ok := s.Notes.Find(func(x Note) bool { return x.ID == *body.After }); ok {
				n.Rank = after.Rank + "_after"
			}
		}
		n.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, http.StatusBadRequest, "Note "+id+" not found")
		return
	}
	note, _ := s.Notes.Find(func(n Note) bool { return n.ID == id })
	writeJSON(w, http.StatusOK, note)
}

func (s *Store) handleRenumberNotes(w http.ResponseWriter, r *http.Request) {
	notes := s.Notes.All()
	for i, n := range notes {
		s.Notes.Update(func(x Note) bool { return x.ID == n.ID }, func(x *Note) {
			x.Rank = fmt.Sprintf("%d", i)
		})
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ── Categories ──

func (s *Store) handleListCategories(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.Categories.All())
}

func (s *Store) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name  string  `json:"name"`
		Color *string `json:"color"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	cat := Category{
		ID:        newID(),
		Name:      body.Name,
		Color:     body.Color,
		CreatedAt: ts(),
	}
	s.Categories.Add(cat)
	writeJSON(w, http.StatusCreated, cat)
}

func (s *Store) handleRenameCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body struct {
		Name string `json:"name"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Categories.Update(func(c Category) bool { return c.ID == id }, func(c *Category) {
		c.Name = body.Name
	})
	if !ok {
		writeError(w, http.StatusBadRequest, "Category "+id+" not found")
		return
	}
	cat, _ := s.Categories.Find(func(c Category) bool { return c.ID == id })
	writeJSON(w, http.StatusOK, cat)
}

func (s *Store) handleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Categories.Remove(func(c Category) bool { return c.ID == id }) {
		writeError(w, http.StatusBadRequest, "Category "+id+" not found")
		return
	}
	writeNoContent(w)
}

// ── Settings ──

func (s *Store) handleGetDefaultProvider(w http.ResponseWriter, r *http.Request) {
	pid, _ := s.Settings["defaultProviderId"]
	mid, _ := s.Settings["defaultModelId"]
	dp := DefaultProvider{
		ProviderID: strPtr(pid),
		ModelID:    strPtr(mid),
	}
	if pid == "" {
		dp.ProviderID = nil
	}
	if mid == "" {
		dp.ModelID = nil
	}
	writeJSON(w, http.StatusOK, dp)
}

func (s *Store) handleSetDefaultProvider(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ProviderID string `json:"providerId"`
		ModelID    string `json:"modelId"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	s.Settings["defaultProviderId"] = body.ProviderID
	s.Settings["defaultModelId"] = body.ModelID
	writeJSON(w, http.StatusOK, DefaultProvider{
		ProviderID: &body.ProviderID,
		ModelID:    &body.ModelID,
	})
}

func (s *Store) handleGetSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	val, _ := s.Settings[key]
	var v *string
	if val != "" {
		v = &val
	}
	writeJSON(w, http.StatusOK, SettingValue{Key: key, Value: v})
}

func (s *Store) handleSetSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	s.Settings[key] = body.Value
	writeJSON(w, http.StatusOK, SettingValue{Key: key, Value: &body.Value})
}
