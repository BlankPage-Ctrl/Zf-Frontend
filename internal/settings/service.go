package settings

import "myproject/internal/client"

type DefaultProvider struct {
	ProviderID *string `json:"providerId"`
	ModelID    *string `json:"modelId"`
}

type SettingValue struct {
	Key   string  `json:"key"`
	Value *string `json:"value"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) GetDefaultProvider() (DefaultProvider, error) {
	return client.DoOK[DefaultProvider](s.c, "GET", "/settings/default-provider", nil, nil)
}

func (s *Service) SetDefaultProvider(providerID, modelID string) (DefaultProvider, error) {
	body := map[string]string{"providerId": providerID, "modelId": modelID}
	return client.DoOK[DefaultProvider](s.c, "PUT", "/settings/default-provider", body, nil)
}

func (s *Service) GetValue(key string) (SettingValue, error) {
	return client.DoOK[SettingValue](s.c, "GET", "/settings/"+key, nil, nil)
}

func (s *Service) SetValue(key, value string) (SettingValue, error) {
	body := map[string]string{"value": value}
	return client.DoOK[SettingValue](s.c, "PUT", "/settings/"+key, body, nil)
}
