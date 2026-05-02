# FoodSetu — Project Workflow

The end-to-end flow that the FoodSetu platform implements.

## Flow Diagram

```
Restaurant / Hotel / Bakery
        ↓
Uploads surplus food
        ↓
System checks category
        ↓
┌─────────────────────────────┬──────────────────────────────────┐
│  Human-safe food            │  Animal-safe food                │
│  → NGO / Shelter            │  → Animal rescue / Feeder group  │
└─────────────────────────────┴──────────────────────────────────┘
        ↓
Nearby verified groups get alert
        ↓
Group claims food
        ↓
Restaurant accepts claim
        ↓
OTP generated
        ↓
Pickup happens
        ↓
Restaurant verifies OTP
        ↓
Food marked as delivered
        ↓
Admin sees impact report
```

## Step-by-step

1. **Donor uploads surplus food** — A restaurant, hotel, or bakery creates a food listing (type, quantity, prep time, pickup window, photos, etc.).
2. **System categorizes the food** — Backend classifies the listing as `human-safe` or `animal-safe` (based on freshness, type, and donor input).
3. **Routing by category**
   - `human-safe` → routed to nearby NGOs / shelters.
   - `animal-safe` → routed to nearby animal rescues / feeder groups.
4. **Alert nearby verified groups** — Only verified receivers within the geofenced radius are notified.
5. **Receiver claims the food** — First eligible group to claim locks the listing for a short window.
6. **Donor accepts the claim** — The restaurant confirms the receiving group.
7. **OTP generated** — A one-time pickup code is generated and shared with the receiver.
8. **Pickup happens** — Receiver travels to the donor location to pick up the food.
9. **Donor verifies OTP** — The donor enters the OTP shown by the receiver to confirm handoff.
10. **Mark as delivered** — Listing transitions to `delivered`; pickup time is recorded.
11. **Admin impact report** — Admin dashboard aggregates meals saved, kg of food rescued, CO₂e avoided, donors/receivers active, etc.

## Core Roles

| Role                  | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| **Donor**             | Restaurant / Hotel / Bakery uploading surplus food.             |
| **Receiver (Human)**  | Verified NGO / Shelter for human-safe food.                     |
| **Receiver (Animal)** | Verified animal rescue / feeder group for animal-safe food.     |
| **Admin**             | Platform admin viewing impact, verifying receivers, moderating. |

## Listing Status Lifecycle

```
draft → posted → claimed → accepted → picked_up → delivered
                          ↘ expired / cancelled
```

## Key Domain Entities (planned)

- **User** (with role: donor / receiver_ngo / receiver_animal / admin)
- **Organization** (donor business or receiver group, with verification status)
- **FoodListing** (type, category, quantity, pickup window, location, status)
- **Claim** (listing ↔ receiving organization, OTP, status)
- **PickupEvent** (timestamp, OTP verification, optional photo proof)
- **ImpactReport** (aggregated metrics over time periods)
