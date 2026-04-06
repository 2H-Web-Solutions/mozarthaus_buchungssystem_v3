# Regiondo Events & Products Fetching Documentation

This document explains how events (products) and their details are fetched from Regiondo and stored within the Mozarthaus Booking System.

## Architecture Overview

The system uses two primary methods for fetching event data:

1.  **Direct Runtime Fetching (Frontend API)**: Real-time retrieval of products, details, and availabilities directly from the Regiondo REST API via a secure proxy.
2.  **Background Synchronization (n8n & Firestore)**: Periodic polling of Regiondo availabilities which are then mapped and stored in Google Cloud Firestore as "Events" for the local booking and seating plan logic.

---

## 1. Direct Runtime Fetching (Frontend API)

This method is used when the application needs the most up-to-date information directly from Regiondo (e.g., in the admin dashboard or product list).

### Core Service
`src/services/regiondoProductsService.ts`

### API Methods
- **`fetchRegiondoProducts(options)`**: Fetches a paginated list of all products (events).
  - *Endpoint:* `GET /v1/products`
- **`fetchRegiondoProductById(productId, options)`**: Fetches the full details of a specific product, including descriptions and images.
  - *Endpoint:* `GET /v1/products/{productId}`
- **`fetchRegiondoAvailabilities(variationId, options)`**: Fetches the available time slots for a specific product variation.
  - *Endpoint:* `GET /v1/products/availabilities/{variationId}`

### Checkout & Totals Fetching
`src/services/regiondoCheckoutService.ts`
- **`getCheckoutTotals(items)`**: Fetches calculated totals, taxes, and required fields for a potential booking.
  - *Endpoint:* `POST /v1/checkout/totals`
- **`listHolds()`**: Fetches a list of active inventory holds (temporary reservations).
  - *Endpoint:* `GET /v1/checkout/hold`

### Proxy & Security Mechanism
To avoid CORS issues and protect sensitive API keys, all frontend requests are routed through a proxy:
- **Local Dev / Preview:** Handled by a Vite plugin (`vite/plugins/regiondoProductsApi.ts`).
- **Production:** Uses the `VITE_REGIONDO_PRODUCTS_API_URL` environment variable.

#### HMAC Signing
Regiondo requires all API requests to be signed using an HMAC-SHA256 hash.
1.  The proxy retrieves `REGIONDO_PUBLIC_KEY` and `REGIONDO_PRIVATE_KEY` from the server environment (not exposed to the client).
2.  It generates a timestamp and a hash based on the timestamp, public key, and query string.
3.  It attaches `X-API-ID`, `X-API-TIME`, and `X-API-HASH` headers to the outgoing request.

---

## 2. Background Synchronization (n8n & Firestore)

For the local seating plan and booking management, "Events" are synchronized from Regiondo to Firestore.

### Workflow
- **File:** `n8n-regiondo-pull-workflow.json`
- **Trigger:** Scheduled polling (every 15 seconds) or manual "sync_regiondo_events" action.

### Data Mapping Process
1.  **Fetch Availabilities:** n8n calls `GET /v1/products/availabilities/31903`.
2.  **Transformation:** The raw JSON (mapping dates to time slots) is flattened into individual event documents.
3.  **ID Generation:** `event_YYYYMMDD_HHmm` (e.g., `event_20240401_1830`).
4.  **Firestore Upsert:**
    - *Path:* `apps/{APP_ID}/events/{eventId}`
    - *Payload:*
      ```json
      {
        "id": "event_20240401_1830",
        "date": "2024-04-01",
        "time": "18:30",
        "title": "Mozart Ensemble",
        "status": "active",
        "updatedAt": "2024-04-01T..."
      }
      ```

---

## 3. Data Structures

### Regiondo Product (Event)
Defined in `src/types/regiondo.ts`. Key fields include:
- `product_id`: Unique ID from Regiondo.
- `name`: Display name of the event.
- `description`: Full HTML description (available in details).
- `variations`: List of ticket/time variations.

### Firestore Event
Used in `src/services/bookingService.ts`.
- Each event in Firestore serves as a container for its own **Seating Plan** subcollection (`/events/{eventId}/seats`).
- When a new event is synced/created, `initializeEventSeats(eventId)` is normally called to populate the seating plan based on the configuration.

---

## Environment Configuration

The following keys are required in `.env.local` for fetching to work:
- `REGIONDO_PUBLIC_KEY`: Your Regiondo API Public ID.
- `REGIONDO_PRIVATE_KEY`: Your Regiondo API Private Key.
- `REGIONDO_API_HOST`: `https://api.regiondo.com` (Live) or `https://sandbox-api.regiondo.com` (Sandbox).
