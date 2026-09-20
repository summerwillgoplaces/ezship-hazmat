# EZShip Hazmat & Dangerous Goods Platform

An intelligent, full-stack compliance automation platform for shipping Hazardous Materials and Dangerous Goods under **ADR 2026**, **DOT 49 CFR**, and **IATA/ICAO** regulations.

![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-green.svg)
![React](https://img.shields.io/badge/React-19-cyan.svg)
![Vite](https://img.shields.io/badge/Vite-5.0%2B-purple.svg)

---

## Key Features

- **ADR 2026 Table A & DOT Hazardous Materials Lookup**: Instant search by UN number, proper shipping name, class, and packing group.
- **Dynamic Net Quantity & Packaging Regulatory Validation**:
  - Real-time client-side + server-side validation against regulatory maximum quantity limits (Passenger Aircraft, Cargo Aircraft, Limited Quantity, and Excepted Quantity).
  - Validation for packaging types: Combination Packagings, Drums, Jerricans, Boxes, and Composite Cylinders.
- **Shipper & Consignee Address Book Database**:
  - Persistent SQLite-backed address book storing business names, addresses, emergency phone contacts, and EORI/EIN numbers.
  - Shipper / Consignee selection directly into shipping documents and wizards.
- **Lithium Battery Compliance Engine**:
  - Step-by-step classification wizard for UN 3480, UN 3481, UN 3090, UN 3091 (Section IA, IB, II).
  - Wh rating calculation, cell count threshold validation, and required warning label generators.
- **Segregation Matrix (ADR 7.5.2 & 49 CFR 177.848)**:
  - Compatibility verification between mixed hazard classes to prevent illegal and hazardous co-loading.
- **Official Shipping Paper & Dangerous Goods Declaration**:
  - Generates professional, printable Shipper's Declaration for Dangerous Goods (SDDG) and ADR Multimodal Transport Documents with emergency response contacts.
- **Package Marking & Labeling Visualizer**:
  - Visual preview of package labels, UN hazard diamonds, orientation arrows, and net quantity markings.

---

## Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Pure Vanilla CSS (Glassmorphic dark UI, micro-animations, responsive layout).
- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLite3, Pydantic v2.
- **Testing**: Pytest with automated compliance and validation test suites.
- **Deployment**: Ready for 1-Click deployment on [Render.com](https://render.com) via `render.yaml` Blueprint or native Procfile.

---

## Getting Started Locally

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm

### 1. Clone Repository
```bash
git clone https://github.com/<username>/ezship-hazmat.git
cd ezship-hazmat
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn hazmat_app.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/docs`

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be running at: `http://localhost:5173`

---

## 1-Click Deployment to Render

This repository includes a native `render.yaml` Blueprint configuration and `render-build.sh` script for zero-configuration free cloud deployment on **Render.com**.

1. Create a free account on [Render.com](https://render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository (`ezship-hazmat`).
4. Render will automatically detect `render.yaml`, build the React frontend bundle, install the FastAPI backend, and launch the unified web service.

---

## Running Tests

Run the backend test suite:
```bash
cd backend
pytest -v
```

---

## License

This project is licensed under the MIT License.
