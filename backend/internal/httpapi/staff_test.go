package httpapi

import "testing"

func TestPasswordHash(t *testing.T) {
	h, e := PasswordHash("really-long-passphrase-2026")
	if e != nil || !passwordOK("really-long-passphrase-2026", h) || passwordOK("wrong-password", h) {
		t.Fatalf("password verification failed: %v", e)
	}
}
func TestPropertyValidation(t *testing.T) {
	v := propertyInput{Slug: "tower-a", Reference: "AUTO-001", Title: "Apartment with city view", Emirate: "Dubai", Community: "Marina", Category: "apartment", ListingType: "sale", ConstructionStatus: "ready", PriceAED: 1500000, UnitMix: []string{" Villas ", ""}}
	if msg := v.validate(); msg != "" {
		t.Fatalf("expected valid, got %q", msg)
	}
	if len(v.UnitMix) != 1 || v.UnitMix[0] != "Villas" {
		t.Fatalf("unit mix not cleaned: %#v", v.UnitMix)
	}
	for name, mutate := range map[string]func(*propertyInput){
		"negative price": func(p *propertyInput) { p.PriceAED = -1 },
		"bad slug":       func(p *propertyInput) { p.Slug = "Tower A" },
		"no community":   func(p *propertyInput) { p.Community = " " },
		"bad category":   func(p *propertyInput) { p.Category = "castle" },
		"long seo title": func(p *propertyInput) { p.SeoTitle = string(make([]byte, 121)) },
	} {
		c := v
		mutate(&c)
		if c.validate() == "" {
			t.Fatalf("%s: expected invalid", name)
		}
	}
}
