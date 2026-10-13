package httpapi

import "testing"

func TestPasswordHash(t *testing.T) {
	h, e := PasswordHash("really-long-passphrase-2026")
	if e != nil || !passwordOK("really-long-passphrase-2026", h) || passwordOK("wrong-password", h) {
		t.Fatalf("password verification failed: %v", e)
	}
}
func TestPropertyValidation(t *testing.T) {
	v := propertyInput{Slug: "tower-a", Reference: "AUTO-001", Title: "Apartment with city view", Emirate: "Dubai", Community: "Marina", Category: "apartment", ListingType: "sale", ConstructionStatus: "ready", PriceAED: 1500000}
	if !v.valid() {
		t.Fatal("expected valid")
	}
	v.PriceAED = -1
	if v.valid() {
		t.Fatal("expected invalid")
	}
}
