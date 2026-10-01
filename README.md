# 🎟️ VenueVista: Event Ticketing & Venue Management

A full-stack web app where admins manage venues and events, and customers pick seats on a live seat map, pay, and get tickets.

Built with **Spring Boot + MySQL** (backend) and **Angular** (frontend).

---

## ✨ Features

**Customers**
- Register / login (passwords hashed with BCrypt)
- Browse upcoming events
- Interactive seat map: VIP / regular / booked / selected seats
- Seats are **held for 10 minutes** while paying; unpaid holds expire automatically
- One-click demo payment: UPI, Card or Cash
- QR code e-ticket for every seat (shown after payment and in My Bookings)
- Book an entire venue for a day (wedding, party, conference): date, guests, purpose; blocked if the venue already has a booking or an event that day
- My Bookings: event tickets + venue bookings, status, cancel (refund marked on payment)

**Admins**
- Add / delete venues
- Add / delete events (venue picked from a dropdown)
- Generate a full seat layout for a venue from the Venues page (rows × seats, VIP rows)
- Verify Ticket page for the entry gate: check a ticket code and check the holder in (a used ticket cannot be reused)

---

## 🛠️ Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | Angular (standalone components), TypeScript, CSS |
| Backend  | Java, Spring Boot, Spring Data JPA, Hibernate, Bean Validation |
| Database | MySQL |
| Tools    | Maven, Git, Swagger (springdoc) |

---

## 🧠 Key Design Decisions

- **Server-side pricing.** The client sends only `userId`, `eventId` and `seatIds`. The backend computes the total from the event's ticket price, so the price cannot be tampered with from the browser.
- **No double booking.** Before booking, the backend checks that every seat exists, belongs to the event's venue, and is not already taken.
- **Atomic booking.** Booking + tickets are created inside one `@Transactional` method; if anything fails, nothing is saved.
- **Seat hold with expiry.** A new booking is `PENDING_PAYMENT` and holds seats for 10 minutes. Expired holds are released automatically.
- **DTOs instead of entities for input.** `BookingRequest`, `EventRequest`, `PaymentRequest` are validated with `@Valid`; responses use `BookingResponse` so internal fields are never exposed.
- **Password never leaves the server.** Hashed with BCrypt and marked `WRITE_ONLY` in JSON.
- **Unguessable ticket codes.** Each ticket gets a random suffix (e.g. `TKT-12-A5-X7K2Q9`) so codes cannot be guessed to fake a ticket.
- **Meaningful HTTP errors.** 400 (bad input), 403 (not your booking), 404 (not found), 409 (seat already booked), 410 (hold expired).

### Booking lifecycle

~~~
Select seats --> PENDING_PAYMENT --(pay within 10 min)--> CONFIRMED
                      |                                       |
                      +--(10 min pass)--> CANCELLED <--(cancel)+
~~~

---

## 📁 Project Structure

~~~
VenueVista/
├── auth-backend/  Spring Boot API  (controller → service → repository → entity, dto)
└── angular-auth/  Angular app      (pages/, services/api.ts)
~~~

---

## 🚀 Run Locally

**Prerequisites:** Java 17+, Node.js 20+, MySQL 8+

**1. Database**: MySQL must be running. The `venuevista` database is created automatically.

**2. Backend**

~~~bash
cd auth-backend
# set your MySQL username/password in src/main/resources/application.properties
./mvnw spring-boot:run
~~~

API runs on `http://localhost:8080`. Swagger UI: `http://localhost:8080/swagger-ui.html`

**3. Frontend**

~~~bash
cd angular-auth
npm install
npm start
~~~

App runs on `http://localhost:4200` (API calls are proxied to port 8080).

**4. Make an admin** (new users are `CUSTOMER` by default):

~~~sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
~~~

---

## 🔌 Main API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/users/register` | Register |
| POST | `/api/users/login` | Login |
| GET / POST / DELETE | `/api/venues` | Venues |
| GET / POST / DELETE | `/api/events` | Events (`POST` takes `venueId`) |
| GET | `/api/seats/venue/{venueId}` | Seats of a venue |
| POST | `/api/seats/venue/{venueId}/generate?rows=&seatsPerRow=&vipRows=` | Generate seat layout |
| GET | `/api/bookings/event/{eventId}/booked-seats` | Taken seats for an event |
| POST | `/api/bookings/book` | Hold seats (creates `PENDING_PAYMENT` booking) |
| GET | `/api/bookings/{id}/details?userId=` | Booking details |
| GET | `/api/bookings/user/{userId}` | A user's bookings |
| PUT | `/api/bookings/{id}/cancel?userId=` | Cancel booking |
| POST | `/api/payments/pay` | Pay for a booking → `CONFIRMED` |
| POST | `/api/venue-bookings` | Book a whole venue for a date |
| GET | `/api/venue-bookings/user/{userId}` | A user's venue bookings |
| GET | `/api/tickets/verify/{code}` | Check a ticket at the gate |
| POST | `/api/tickets/verify/{code}/check-in` | Mark ticket as USED (entry allowed) |

---

## 🔮 Future Improvements

- **JWT + Spring Security**: identify the user from a token instead of a `userId` parameter, and enforce ADMIN-only endpoints on the server (currently admin actions are hidden in the UI only)
- Real payment gateway (e.g. Razorpay) with webhooks
- Unique DB constraint per (event, seat) to make double booking impossible even under heavy concurrency
- Email / PDF tickets
- Camera-based QR scanning on the Verify page
- Unit and integration tests
