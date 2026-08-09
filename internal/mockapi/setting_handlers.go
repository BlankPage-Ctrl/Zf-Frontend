package mockapi

import (
	"net/http"
)

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
	writeJSON(w, r, http.StatusOK, dp)
}

func (s *Store) handleSetDefaultProvider(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ProviderID string `json:"providerId"`
		ModelID    string `json:"modelId"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	s.Settings["defaultProviderId"] = body.ProviderID
	s.Settings["defaultModelId"] = body.ModelID
	writeJSON(w, r, http.StatusOK, DefaultProvider{
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
	writeJSON(w, r, http.StatusOK, SettingValue{Key: key, Value: v})
}

func (s *Store) handleSetSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	s.Settings[key] = body.Value
	writeJSON(w, r, http.StatusOK, SettingValue{Key: key, Value: &body.Value})
}
