# Intelligent Carpooling Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application that provides intelligent carpool matching with AI-powered ride recommendations and explanations.

## 🌟 Features

- **Smart Ride Matching**: AI-powered algorithm to find the best carpool matches
- **Real-time Updates**: Live tracking and notifications using Socket.IO
- **AI Explanations**: ML-powered reasoning for ride recommendations
- **Secure Authentication**: JWT-based user authentication
- **Payment Integration**: Supports Stripe payment gateway
- **Interactive Map**: Real-time ride visualization with Leaflet
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS
- React Router
- Axios
- Socket.IO Client
- Leaflet (Maps)
- Framer Motion (Animations)

### Backend
- Node.js
- Express
- MongoDB (with Mongoose)
- Socket.IO
- JWT Authentication
- Nodemailer (Email notifications)
- AI/ML Integration (Hugging Face - Mistral 8x7B)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB (local or cloud)
- Hugging Face API Key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/carpool-mern.git
   cd carpool-mern
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `server` and `client` directories
   - Update the variables with your configuration

3. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

4. **Start the development servers**
   ```bash
   # In the server directory
   npm run dev
   
   # In a new terminal, from the client directory
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 🤖 AI Integration

The system uses Mistral 8x7B through Hugging Face's API to provide:
- Natural language explanations for ride recommendations
- Intelligent matching based on multiple factors
- Context-aware suggestions

To enable AI features, set up your Hugging Face API key in the server's `.env` file:
```
HUGGINGFACE_API_KEY=your_api_key_here
```

## 🔒 Environment Variables

### Server (`.env` in server directory)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
HUGGINGFACE_API_KEY=your_hf_key
# Payment providers (optional)
STRIPE_SECRET_KEY=your_stripe_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
# Email (optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
```

## 📂 Project Structure

```
carpool-mern/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React components and logic
├── server/                # Backend server
│   ├── src/
│   │   ├── config/       # Database and other configurations
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic and AI services
│   │   └── index.js      # Server entry point
│   └── .env.example      # Example environment variables
└── README.md             # This file
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## © Copyright

Made by Shobhit Shukla & Kumar Tejaswa. All rights Reserved.

## 🙏 Acknowledgments

- Mistral AI for the powerful language model
- All open-source libraries and frameworks used in this project
- The MERN stack community for continuous support and resources
