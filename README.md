# PlaceTrack – Placement Management System

PlaceTrack is a full-stack Placement Management System built using React, Node.js, Express, and MongoDB. The application supports four roles:

* Admin
* Student
* Company
* Trainer

Each role has its own authentication flow and dashboard.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB
* JWT Authentication

---

## Prerequisites

Make sure the following are installed:

* Node.js (v18 or higher)
* npm
* MongoDB

---

## Clone the Repository

```bash
git clone <repository-url>
cd placement-management-system
```

---

## Run the Backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
npm install
npm run dev
```

Backend will start on:

```text
http://localhost:5000
```

---

## Run the Frontend

Open a second terminal and navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on:

```text
http://localhost:3000
```

---

## Application Access

After both servers are running, open:

```text
http://localhost:3000
```

in your browser.

---

## Demo Credentials

| Role    | Email                                                   | Password     |
| ------- | ------------------------------------------------------- | ------------ |
| Admin   | [admin@placement.com](mailto:admin@placement.com)       | Admin@1234   |
| Trainer | [trainer@placement.com](mailto:trainer@placement.com)   | Trainer@1234 |
| Company | [company1@placement.com](mailto:company1@placement.com) | Company@1234 |
| Student | [student1@placement.com](mailto:student1@placement.com) | Student@1234 |

---

## Project Features

* Role-based authentication
* Separate dashboards for Admin, Student, Company, and Trainer
* JWT authentication with refresh tokens
* Job posting and approval workflow
* Student profile and application management
* Company recruitment management
* Trainer feedback and tracking
* MongoDB database integration
* REST API architecture

---

## Environment Variables

Create a `.env` file inside the `backend` folder and configure your MongoDB connection and JWT secrets.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/placement_db
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

## Notes

Make sure MongoDB is running before starting the backend server.

If the backend and frontend are both running successfully, the application will be accessible from:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```
