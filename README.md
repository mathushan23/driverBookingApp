# GoRide Driver Booking App

GoRide is a role-based ride booking web application with separate flows for riders, drivers, and admins. Riders can request rides, drivers can manage ride requests and status updates, and admins can manage users and driver approvals.

## Features

- Rider signup, login, onboarding, dashboard, booking flow, and ride history
- Driver signup, login, onboarding, dashboard, ride requests, ride status updates, and ride history
- Admin login, dashboard, user management, and driver approval controls
- Token-based API authentication using `Authorization: Bearer <token>`
- MySQL persistence with Spring Data JPA
- React frontend with protected role-based routes
- Google Maps integration support through the frontend dependencies

## Tech Stack

### Backend

- Java 17
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- Spring Validation
- Spring Security Crypto
- MySQL
- Maven

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Google Maps React API


## Live Credentials

Use these accounts to access the deployed/live system.

| Role | Email | Password |
| --- | --- | --- |
| Driver | `driver@gmail.com` | `driver@123` |
| Rider | `rider@gmail.com` | `rider@123` |
| Admin | `admin@goride.com` | `admin123` |


### API Routes

- `POST /api/auth/signup` - Register a user
- `POST /api/auth/login` - Login and receive auth data
- `POST /api/bookings` - Create a booking as a rider
- `GET /api/bookings/{bookingId}` - Get booking details
- `GET /api/bookings/rider-history/{riderId}` - Rider booking history
- `GET /api/bookings/driver-history/{driverId}` - Driver booking history
- `GET /api/bookings/driver-requests/{driverId}` - Nearby pending driver requests
- `PATCH /api/bookings/{bookingId}/accept` - Driver accepts booking
- `PATCH /api/bookings/{bookingId}/cancel` - Rider cancels booking
- `PATCH /api/bookings/{bookingId}/complete` - Driver completes booking
- `PATCH /api/bookings/{bookingId}/driver-status` - Driver updates ride status

