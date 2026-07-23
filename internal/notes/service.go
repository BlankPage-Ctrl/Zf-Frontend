package notes

import (
	"strconv"

	"myproject/internal/client"
)

type Note struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CategoryID string `json:"category_id"`
	Desc      string `json:"desc"`
	Details   string `json:"details"`
	Rank      string `json:"rank"`
	Priority  string `json:"priority"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	Version   int    `json:"version"`
}

type NoteDto struct {
	Name       string  `json:"name"`
	CategoryID *string `json:"category_id,omitempty"`
	Desc       *string `json:"desc,omitempty"`
	Details    *string `json:"details,omitempty"`
	Priority   *string `json:"priority,omitempty"`
}

type MovePosition struct {
	Before *string `json:"before,omitempty"`
	After  *string `json:"after,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List(filter map[string]any) ([]Note, error) {
	q := map[string]string{}
	for k, v := range filter {
		if str, ok := v.(string); ok {
			q[k] = str
		}
		if num, ok := v.(float64); ok {
			q[k] = strconv.FormatFloat(num, 'f', 0, 64)
		}
	}
	return client.DoOK[[]Note](s.c, "GET", "/notes", nil, q)
}

func (s *Service) Get(id string) (Note, error) {
	return client.DoOK[Note](s.c, "GET", "/notes/"+id, nil, nil)
}

func (s *Service) Create(dto NoteDto) (Note, error) {
	return client.DoOK[Note](s.c, "POST", "/notes", dto, nil)
}

func (s *Service) Update(id string, dto map[string]any) (Note, error) {
	return client.DoOK[Note](s.c, "PATCH", "/notes/"+id, dto, nil)
}

func (s *Service) Delete(id string) error {
	return client.DoVoid(s.c, "DELETE", "/notes/"+id, nil)
}

func (s *Service) Move(id string, pos MovePosition) (Note, error) {
	return client.DoOK[Note](s.c, "POST", "/notes/"+id+"/move", pos, nil)
}

func (s *Service) Renumber() (map[string]bool, error) {
	return client.DoOK[map[string]bool](s.c, "POST", "/notes-renumber", nil, nil)
}
