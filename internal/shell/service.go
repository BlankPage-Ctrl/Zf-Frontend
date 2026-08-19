package shell

import "myproject/internal/client"

type SegmentInfo struct {
	Cmd  string   `json:"cmd"`
	Args []string `json:"args"`
}

type Matched struct {
	Pattern string `json:"pattern"`
	Tier    string `json:"tier"`
}

type PendingApproval struct {
	ID        string        `json:"id"`
	Command   string        `json:"command"`
	Cwd       string        `json:"cwd"`
	Segments  []SegmentInfo `json:"segments"`
	Matched   Matched       `json:"matched"`
	Reason    string        `json:"reason,omitempty"`
	CreatedAt string        `json:"createdAt"`
	ExpiresAt string        `json:"expiresAt"`
}

type DecideResult struct {
	Resolved bool `json:"resolved"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) PendingApprovals() ([]PendingApproval, error) {
	return client.DoOK[[]PendingApproval](s.c, "GET", "/shell/approvals/pending", nil, nil)
}

func (s *Service) Decide(id, decision string) (DecideResult, error) {
	return client.DoOK[DecideResult](s.c, "POST", "/shell/approvals/"+id, map[string]string{
		"decision": decision,
	}, nil)
}
