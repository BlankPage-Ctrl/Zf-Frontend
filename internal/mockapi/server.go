package mockapi

import (
	"net/http/httptest"

	"myproject/internal/client"
)

func EnableMock(c *client.Client) {
	store := NewSeedStore()
	handler := store.NewHandler()
	server := httptest.NewServer(handler)
	c.BaseURL = server.URL
}

func EnableMockWithHandler(c *client.Client, store *Store) {
	handler := store.NewHandler()
	server := httptest.NewServer(handler)
	c.BaseURL = server.URL
}
