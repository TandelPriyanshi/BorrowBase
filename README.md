# Borrowbase – Neighborhood Resource Exchange #

A hyperlocal app that helps neighbors lend, borrow, and exchange everyday items—like tools, books, furniture, and more. The goal is to encourage sustainability while strengthening community interaction.

🎯 Goal

To create a Neighborhood Resource Exchange App where users can:
- Borrow items instead of buying new
- Lend unused items to others nearby
- Build trust and connection within their community

📦 Features

- 🔐 User Authentication – Secure login & signup
- 🏠 User Profile with Location Verification – Validate neighbors by location
- 📸 Resource Listing – Add items with photos & availability status
- 📥 Borrow Requests – Manage lending & borrowing requests
- 📰 Resource Feed – Browse items with filters (distance, category, etc.)
- 🔔 Notifications – Get updates on requests and exchanges
- 💬 Chat Module – In-app messaging (basic or real-time)
- ⭐ Ratings & Reviews – Build trust through user feedback

💻 Tech Stack

- Frontend: React + TailwindCSS
- Backend: Node.js + Express
- Database: PostgreSQL

📖 Usage

- Sign up and verify your location
- Create your profile and list items to lend
- Browse available resources nearby
- Send/receive borrow requests
- Chat with neighbors to coordinate
- Leave ratings & reviews after exchange


Installation & Setup

1.	Clone the repository
- git clone https://github.com/TandelPriyanshi/BorrowBase
- cd borrowbase
  
2.	Backend & frontend Setup
- npm install
- npm run start   
  -	Runs backend on http://localhost:5173
  -	Runs frontend on http://localhost:3000
3.	Database Setup
- Create a PostgreSQL database borrowbase
- Import migration/SQL scripts from /backend/db/
- Update .env in backend with your credentials:

  - PG_HOST=localhost
  - PG_USER=postgres
  - PG_PASSWORD=yourpassword
  - PG_DATABASE =borrowbase
  - PG_PORT="5433"
  - JWT_SECRET=your_jwt_secret
  - JWT_EXPIRES_IN=1d

4.	Run the App

- Open http://localhost:5173 in browser. Sign up → Verify location → Start borrowing/lending 🚀

- Testing
  - Manual testing of modules (login, listing, borrowing).
  - API testing via Postman.
  - Database queries validated with test users/items.

- Results
  - Fully functional neighborhood resource exchange cycle.
  - Promotes trust and sustainability in communities.

Future Enhancements
- 📱 Mobile app version
- 🤖 AI-based item recommendations
- 🌍 Google Maps API for location-based filtering
- 💳 Wallets & in-app payments for deposits
- 🔔 Push notifications

Acknowledgements
- React Docs
- Node.js Docs
-	PostgreSQL Docs
-	JWT Guides
-	TailwindCSS Docs

