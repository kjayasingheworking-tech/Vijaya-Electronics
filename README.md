# Vijaya Electronics

Vijaya Electronics is a full-stack electronics management system with a React frontend and an Express/MongoDB backend. It is designed to support customer, supplier, and admin workflows through a routed web application.

## What This Project Does

- Provides a frontend portal for customers, suppliers, and admins.
- Supports supplier management, purchase orders, invoices, products, and notifications.
- Handles customer tickets, feedback, and related support workflows.
- Uses a Node.js and Express API connected to MongoDB for persistent data storage.

## Tech Stack

- React
- React Router DOM
- React Scripts
- Express
- MongoDB
- Mongoose
- Nodemon
- Axios
- React Toastify

## Run Locally

The project is split into two apps: `backend` and `frontend`.

### Backend

1. Install dependencies:

```
cd backend
npm install
```

2. Create a `.env` file in the `backend` folder with at least:

```
MONGO_URI=your_mongodb_connection_string
PORT=5001
```

3. Start the backend server:

```
npm run dev
```

### Frontend

1. Install dependencies:

```
cd frontend
npm install
```

2. Start the frontend app:

```
npm run dev
```

3. Open the app in your browser at the local URL shown in the terminal.

## Project Structure

```
backend/
├── config/        # Database connection and server configuration
├── controllers/   # Route handlers for business logic
├── middleware/    # Authentication, validation, and upload middleware
├── models/        # Mongoose models
├── routes/        # API route definitions
├── uploads/       # Uploaded files and assets
└── server.js      # Backend entry point

frontend/
├── public/        # Static assets and HTML template
├── src/
│   ├── api/       # Axios API helpers
│   ├── components/# Reusable UI components
│   ├── context/   # Authentication context
│   ├── hooks/     # Custom React hooks
│   ├── pages/     # Route-level pages
│   ├── routes/    # Route guards
│   └── styles/    # Global and component styles
└── src/App.js     # Main route setup
```

## Notes

- The backend will not start correctly without a valid `MONGO_URI` in `backend/.env`.
- The frontend currently uses `react-scripts` and runs with `npm run dev`.
- Some ESLint warnings may appear during startup, but they do not block the app from running.

## Clone the Repository

```
git clone https://github.com/kjayasingheworking-tech/Vijaya-Electronics.git
```