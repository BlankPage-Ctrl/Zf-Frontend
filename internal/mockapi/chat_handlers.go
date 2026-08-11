package mockapi

import (
	"net/http"
)

func (s *Store) handleListChats(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chats := s.Chats.Filter(func(c Chat) bool { return c.WorkspaceID == wsID })
	writeJSON(w, r, http.StatusOK, chats)
}

func (s *Store) handleGetChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	id := r.PathValue("id")
	chat, ok := s.Chats.Find(func(c Chat) bool { return c.ID == id })
	if !ok || chat.WorkspaceID != wsID {
		writeError(w, r, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	writeJSON(w, r, http.StatusOK, chat)
}

func (s *Store) handleCreateChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	var body struct {
		Title        string  `json:"title"`
		ProviderID   *string `json:"providerId"`
		ModelID      *string `json:"modelId"`
		SystemPrompt *string `json:"systemPrompt"`
		ThinkingMode string  `json:"thinkingMode"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	chat := Chat{
		ID:           newID(),
		Title:        body.Title,
		ProviderID:   body.ProviderID,
		ModelID:      body.ModelID,
		SystemPrompt: body.SystemPrompt,
		ThinkingMode: body.ThinkingMode,
		WorkspaceID:  wsID,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	s.Chats.Add(chat)
	writeJSON(w, r, http.StatusCreated, chat)
}

func (s *Store) handleUpdateChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
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
		if v, ok := body["thinkingMode"].(string); ok {
			chat.ThinkingMode = v
		}
		chat.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	chat, _ := s.Chats.Find(func(c Chat) bool { return c.ID == id })
	writeJSON(w, r, http.StatusOK, chat)
}

func (s *Store) handleDeleteChat(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Chats.Remove(func(c Chat) bool { return c.ID == id }) {
		writeError(w, r, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	writeNoContent(w)
}

func (s *Store) handleGetMessages(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusOK, s.Messages)
}

func (s *Store) handlePostMessage(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Message *struct {
			Role string `json:"role"`
		} `json:"message"`
	}
	if err := readBody(r, &body); err != nil || body.Message == nil {
		writeError(w, r, http.StatusBadRequest, "body.message is required")
		return
	}
	if body.Message.Role != "user" {
		writeError(w, r, http.StatusBadRequest, "only user messages are accepted")
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
		writeError(w, r, http.StatusInternalServerError, "No mock assistant message available")
		return
	}

	streamMessageSSE(w, r, *assistantMsg)
}
