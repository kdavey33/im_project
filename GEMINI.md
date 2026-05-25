# im_system - Laptop Inventory Management

## Project Overview
`im_system` is an Inventory Management System designed for a call center to manage over 200 laptops. The primary goal is to track the lifecycle and location of these assets.

### Core Requirements
- **Asset Tracking:** Monitor >200 laptops.
- **Attributes:** Each laptop must have its **Model Number**, **Serial Number**, and **Location** tracked.
- **Location Management:**
    - **Workstations:** Laptops assigned to specific desks (not necessarily user-specific).
    - **Storage Closet:** Laptops not currently in use.
- **Extensibility:** The system must be designed to accommodate future business needs (e.g., maintenance logs, user assignments, software tracking).

### Main Technologies (Confirmed)
- **Language:** JavaScript/TypeScript (Node.js)
- **Framework:** Express (Backend API)
- **Database:** SQLite (using Sequelize ORM)
- **Frontend:** React (Vite-based)

## Building and Running

### Backend
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Seed the database (optional/first time): `node seed.js`
4. Start the server: `node index.js` (or `npm run dev` if configured)
   - The API runs on `http://localhost:5000`

### Frontend
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
   - The UI runs on `http://localhost:5173`

### Docker
1. Build the image:
   ```bash
   docker build -t im_system .
   ```
2. Run the container:
   ```bash
   docker run -p 5000:5000 im_system
   ```
   - The application (Frontend + Backend) will be available at `http://localhost:5000`.

## Development Conventions
- **Database:** SQLite is used for development. The schema is managed via Sequelize models in `backend/models/`.
- **API:** RESTful endpoints are located in `backend/routes/`.
- **Frontend:** React with Vite. API calls are made using Axios.
- **Location Tracking:** Every laptop must be associated with a `LocationId`. Locations are categorized as `workstation` or `storage`.

## Completed Tasks
- [x] **Schema Design:** Defined database schema for Laptops and Locations.
- [x] **Project Initialization:** Set up Node.js/Express backend and React frontend.
- [x] **API Development:** Implemented CRUD for laptops and location tracking.
- [x] **UI Prototype:** Created a dashboard with search, add form, and move functionality.
- [x] **Bulk Import:** Added CSV import capability.
- [x] **Conflict Resolution:** Implemented logic to handle workstation assignment conflicts.
- [x] **Dockerization:** Created a multi-stage Dockerfile for production deployment.

## Future Tasks
- [ ] Implement user authentication for management.
- [ ] Add maintenance logs and laptop history.
- [ ] Integrate barcode/QR code scanning for easier inventory entry.
