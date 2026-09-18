package insight

import (
	"strconv"

	"myproject/internal/client"
)

type SyncAccepted struct {
	Accepted bool   `json:"accepted"`
	Force    bool   `json:"force"`
	At       string `json:"at"`
}

type SearchHit struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Kind      string `json:"kind"`
	FilePath  string `json:"filePath"`
	LineRange struct {
		Start int `json:"start"`
		End   int `json:"end"`
	} `json:"lineRange"`
}

type SearchResult struct {
	Query string         `json:"query"`
	Hits  []SearchHit    `json:"hits"`
	Stats map[string]any `json:"stats"`
}

type Status struct {
	WorkspaceID string `json:"workspaceId"`
	Enabled     bool   `json:"enabled"`
	Running     bool   `json:"running"`
	ProjectPath string `json:"projectPath"`
}

type SearchParams struct {
	Query     string `json:"query"`
	Mode      string `json:"mode,omitempty"`
	Limit     int    `json:"limit,omitempty"`
	File      string `json:"file,omitempty"`
	Container string `json:"container,omitempty"`
}

// Service talks to the backend insight endpoints over the shared client
// transport (HTTP and STDIO both work — see stdioRoutes in client/stdio.go).
type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) Ensure(workspaceID string) (Status, error) {
	return client.DoOK[Status](s.c, "POST", "/workspaces/"+workspaceID+"/insight/ensure", map[string]any{}, nil)
}

func (s *Service) GetStatus(workspaceID string) (Status, error) {
	return client.DoOK[Status](s.c, "GET", "/workspaces/"+workspaceID+"/insight/status", nil, nil)
}

func (s *Service) Stop(workspaceID string) (map[string]any, error) {
	return client.DoOK[map[string]any](s.c, "DELETE", "/workspaces/"+workspaceID+"/insight", nil, nil)
}

func (s *Service) Sync(workspaceID string, force bool) (SyncAccepted, error) {
	return client.DoOK[SyncAccepted](s.c, "POST", "/workspaces/"+workspaceID+"/insight/sync", map[string]any{"force": force}, nil)
}

func (s *Service) Search(workspaceID string, p SearchParams) (SearchResult, error) {
	q := map[string]string{"query": p.Query}
	if p.Mode != "" {
		q["mode"] = p.Mode
	}
	if p.Limit > 0 {
		q["limit"] = strconv.Itoa(p.Limit)
	}
	if p.File != "" {
		q["file"] = p.File
	}
	if p.Container != "" {
		q["container"] = p.Container
	}
	return client.DoOK[SearchResult](s.c, "GET", "/workspaces/"+workspaceID+"/insight/search", nil, q)
}

// settingValue mirrors the GET/PUT /settings/:key payload.
type settingValue struct {
	Key   string  `json:"key"`
	Value *string `json:"value"`
}

// insightKey builds the workspace-scoped settings key, mirroring
// workspaceKey() in apps/shared/workspace-settings.ts.
func insightKey(workspaceID string) string {
	return "workspace:" + workspaceID + ":insight"
}

// IsEnabled reads workspace:<id>:insight via the generic settings endpoints
// (default true when absent/empty).
func (s *Service) IsEnabled(workspaceID string) (bool, error) {
	v, err := client.DoOK[settingValue](s.c, "GET", "/settings/"+insightKey(workspaceID), nil, nil)
	if err != nil {
		return false, err
	}
	if v.Value == nil || *v.Value == "" {
		return true, nil
	}
	raw := *v.Value
	// trim spaces
	for len(raw) > 0 && (raw[0] == ' ' || raw[0] == '\t' || raw[0] == '\n') {
		raw = raw[1:]
	}
	for len(raw) > 0 && (raw[len(raw)-1] == ' ' || raw[len(raw)-1] == '\t' || raw[len(raw)-1] == '\n') {
		raw = raw[:len(raw)-1]
	}
	lower := ""
	for _, r := range raw {
		if r >= 'A' && r <= 'Z' {
			lower += string(r + 32)
		} else {
			lower += string(r)
		}
	}
	switch lower {
	case "false", "0", "off", "disabled":
		return false, nil
	default:
		return true, nil
	}
}

// SetEnabled writes workspace:<id>:insight ("true"/"false") via the generic
// settings endpoints.
func (s *Service) SetEnabled(workspaceID string, enabled bool) (bool, error) {
	v := "false"
	if enabled {
		v = "true"
	}
	if _, err := client.DoOK[settingValue](s.c, "PUT", "/settings/"+insightKey(workspaceID), map[string]string{"value": v}, nil); err != nil {
		return false, err
	}
	return enabled, nil
}
