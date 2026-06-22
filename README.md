# 🎗️ CAN-QURE: AI-Powered Oncology Ecosystem

[![Status](https://img.shields.io/badge/Status-Final_Submission-brightgreen)](https://github.com/White-D-coder/CAN-QURE)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CAN-QURE** is a cutting-edge cancer care management platform designed to bridge the fragmented healthcare ecosystem. It provides a centralized, secure, and intelligent dashboard for patients and oncologists to manage medical records, treatment histories, and clinical data.

---

## 🚀 Live Demo
> [!IMPORTANT]
> **Live Project Link:** [Click here to view the live application](https://canqure.vercel.app/)

---

## 📖 Table of Contents
- [Executive Summary](#-executive-summary)
- [Key Features](#-key-features)
- [Technical Architecture](#-technical-architecture)
- [System Design & Diagrams](#-system-design--diagrams)
- [Getting Started](#-getting-started)
- [Future Roadmap](#-future-roadmap)

---

## 📝 Executive Summary
Currently, cancer care is plagued by disorganized paper trails—reports from disparate labs, hospitals, and diagnostic centers are scattered, leading to critical delays in doctor reviews and patient anxiety. 

**CAN-QURE** acts as an intelligent digital layer, consolidating this data into a structured, accessible, and bilingual system, laying the groundwork for future AI-driven diagnostics and analytics.

---

## ✨ Key Features

### 👤 Patient Dashboard
- **Secure Medical Vault**: Upload and categorize Lab Reports, Scans, and Biopsies.
- **Visual Timeline**: View medical history in a chronological format.
- **Bilingual Interface**: Native support for **English** and **Hindi**.
- **Doctor Discovery**: Search and book appointments with specialized oncologists.

### 🩺 Doctor Dashboard
- **Patient 360 View**: Complete, structured patient profile before consultation.
- **Digital Prescriptions**: Issue and manage prescriptions digitally.
- **Slot Management**: Efficiently manage appointment queues.

### 🛠️ Admin Dashboard
- **User Management**: Oversee patient and doctor verifications.
- **System Analytics**: Monitor platform growth and usage statistics.

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: MongoDB (Scalable medical data storage)
- **ML/AI**: Python (Risk Assessment & OCR)
- **Security**: JWT Authentication, Bcrypt Hashing

### Clean Architecture
The project follows **Clean Architecture** principles and **Object-Oriented Programming (OOP)**:
- **Controllers**: Handle request validation and responses.
- **Services**: Contain core business logic.
- **Data Access**: Abstracted via Prisma for flexibility.

---

## 📊 System Design & Diagrams

We have documented the system architecture using detailed Mermaid diagrams:

| Diagram Type | Description | Link |
| :--- | :--- | :--- |
| **ER Diagram** | Database schema and relationships | [View ER Diagram](ErDiagram.md) |
| **Class Diagram** | OOP structure and class relationships | [View Class Diagram](classDiagram.md) |
| **Sequence Diagram** | Interaction flow between components | [View Sequence Diagram](sequenceDiagram.md) |
| **Use Case Diagram** | User roles and system interactions | [View Use Case Diagram](useCaseDiagram.md) |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance
- Python 3.x (for ML features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/White-D-coder/CAN-QURE.git
   cd CAN-QURE
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend-web
   npm install
   npm run dev
   ```

---

## 🔮 Future Roadmap
- [ ] **AI Report Analyzer**: OCR + NLP to auto-fill patient data from PDFs.
- [ ] **Predictive Analytics**: Early warning system for missed treatments.
- [ ] **Voice-to-Text**: Voice-driven clinical notes for doctors.
- [ ] **Multi-language GenAI**: Real-time translation of medical notes.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed for the SESD Project Submission - April 2026*
