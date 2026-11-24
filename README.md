
# 🏥 Medilink – Doctor Appointment Management System

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs)
![Express.js](https://img.shields.io/badge/Express.js-REST_API-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss)

## 📖 Project Overview

Medilink is a full-stack Online Doctor Appointment Management System developed for Jayanthi Medical Centre, Kekirawa, Sri Lanka.

The system aims to replace manual appointment management processes with a centralised digital platform that improves appointment scheduling, doctor availability management, patient record management and administrative efficiency.

## 🎓 Academic Information

| Information | Details |
|---|---|
| University | Kingston University, UK |
| Institution | ESOFT Metro Campus |
| Programme | BSc (Hons) Software Engineering |
| Project Type | Final Year Software Engineering Project |
| Client | Jayanthi Medical Centre |
| Architecture | MERN Stack |

## ✨ Key Features

### 👤 Patient Module

- Patient registration and authentication
- Doctor search and profile viewing
- Doctor availability checking
- Online appointment booking
- Appointment cancellation
- Online payments
- Appointment history
- Medical records
- Invoice management
- Doctor ratings and reviews
- Profile management
- Password recovery

### 👨‍⚕️ Doctor Module

- Doctor dashboard
- Profile management
- Consultation availability management
- Appointment request management
- Patient information management
- Consultation record management
- Appointment status updates
- Invoice and review management

### 🛡️ Administrator Module

- Administrative dashboard
- Doctor management
- Patient management
- Medical speciality management
- Appointment management
- Transaction management
- Review management
- Administrative profile management

### 🤖 Chatbot Module

- Appointment-related enquiries
- Doctor availability assistance
- Chatbot-assisted appointment booking
- Booking confirmation assistance

## 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Axios
- shadcn/ui

### Backend

- Node.js
- Express.js
- REST API
- Socket.IO
- JWT Authentication
- bcryptjs
- Nodemailer

### Database

- MongoDB
- Mongoose ODM

### Payment Integration

- PayHere

## 🏗️ System Architecture

Patient / Doctor / Administrator

        ↓

React.js Frontend

        ↓

Express.js REST API

        ↓

Node.js Application Logic

        ↓

MongoDB Database

## 📁 Project Structure

```text
doctor-appointment-management-system/
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/Suhaitsht/doctor-appointment-management-system.git
cd doctor-appointment-management-system
```

### Install Frontend Dependencies

```bash
cd client
npm install
```

### Install Backend Dependencies

```bash
cd ../server
npm install
```

### Environment Configuration

Create the required `.env` files inside the client and server directories.

Configure the required database connection, JWT authentication, email service, payment gateway and chatbot environment variables according to the application configuration.

Actual credentials are excluded from version control for security reasons.

### Start the Backend

```bash
cd server
npm start
```

### Start the Frontend

Open a separate terminal:

```bash
cd client
npm run dev
```

## 🔐 Security Features

- Password hashing
- JWT-based authentication
- Role-based access control
- Protected routes
- Input validation
- Environment variable management
- Password recovery
- Account access restrictions

## 📸 System Screenshots

System screenshots and implementation evidence are provided in the final project report.

## 🔮 Future Enhancements

- Automated database backup and recovery
- Advanced reporting and analytics
- Native mobile application
- Additional healthcare integrations
- Further performance optimisation

## 👨‍💻 Developer

**Suhait**

Software Engineering Undergraduate

Kingston University, UK – ESOFT Metro Campus

GitHub: https://github.com/Suhaitsht

## 📄 Academic Notice

This project was developed for academic purposes as part of a Software Engineering degree programme.

