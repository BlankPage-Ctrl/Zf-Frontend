package categories

import "myproject/internal/client"

type Category struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Color     *string `json:"color"`
	IsDefault bool    `json:"is_default"`
	CreatedAt string  `json:"created_at"`
}

type CategoryDto struct {
	Name  string  `json:"name"`
	Color *string `json:"color,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List() ([]Category, error) {
	return client.DoOK[[]Category](s.c, "GET", "/categories", nil, nil)
}

func (s *Service) Create(dto CategoryDto) (Category, error) {
	return client.DoOK[Category](s.c, "POST", "/categories", dto, nil)
}

func (s *Service) Rename(id, name string) (Category, error) {
	return client.DoOK[Category](s.c, "PATCH", "/categories/"+id, map[string]string{"name": name}, nil)
}

func (s *Service) Delete(id string) error {
	return client.DoVoid(s.c, "DELETE", "/categories/"+id, nil)
}
