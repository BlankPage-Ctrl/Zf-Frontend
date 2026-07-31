package mockapi

import (
	"encoding/json"
	"net/http"
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
	return 	json.NewDecoder(r.Body).Decode(v)
}
