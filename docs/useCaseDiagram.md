```mermaid
usecaseDiagram
    actor Patient
    actor Doctor
    actor System

    package "CAN-QURE: AI-Powered Bilingual Platform" {
        
        usecase "Register & Login" as Auth
        usecase "Upload Medical Reports (PDF/Image)" as Upload
        usecase "View Organized Reports" as ViewReports
        usecase "View Patient Profile" as ViewProfile
        usecase "Manage Medical History" as ManageHistory
        
        usecase "View Bilingual Summaries (Future AI)" as AI
        
        usecase "Store Reports Securely" as Store
        usecase "Authenticate Users" as SysAuth
    }

    Patient --> Auth
    Patient --> Upload
    Patient --> ViewReports
    Patient --> ViewProfile
    Patient --> ManageHistory
    Patient --> AI

    Doctor --> Auth
    Doctor --> ViewProfile
    Doctor --> ViewReports
    Doctor --> ManageHistory

    System --> SysAuth
    System --> Store
```
