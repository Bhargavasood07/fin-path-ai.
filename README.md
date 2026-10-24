# FinPath AI — RBI Grounded Financial Platform & App

> **Complete Full-Stack Application**: Next.js 14 + FastAPI + SQLite + Official RBI Circular Grounding + Optional OpenAI API / File Search.

FinPath AI is an official regulatory-grounded financial intelligence suite for loan calculations, Key Facts Statement (KFS) audits, and borrower rights advisory. Built in compliance with the **Reserve Bank of India (RBI) Circular DOR.MCS.REC.21/01.01.001/2024-25** on *Key Facts Statement (KFS) for Loans & Advances*.

---

## 🌟 Key Features

1. **Reducing Balance EMI & True APR Calculator**:
   - Computes standard reducing balance EMIs.
   - Calculates **Effective Annual Percentage Rate (APR)** factoring in all upfront processing fees, documentation costs, and bundled insurance via numerical IRR.
   - Complete month-by-month and annual amortization schedule with CSV export.
   - Prepayment and tenure reduction simulator.

2. **RBI Key Facts Statement (KFS) Document Checker**:
   - Audits loan sanction terms and contracts against the April 2024 RBI circular.
   - Checks **Cooling-Off / Look-Up Window** (minimum 3 days for loans $\ge$ 7 days).
   - Detects **Illegal Compounding Penal Interest** vs permissible simple penal charges.
   - Unmasks predatory APR disparities and coercive third-party insurance bundling.
   - Validates Principal Nodal Officer disclosures and 30-day escalation to the RBI Ombudsman (`cms.rbi.org.in`).

3. **Source-Grounded AI Financial Assistant**:
   - **Local Grounded Demo Mode (Default / 100% Free)**: Retrieves matching official RBI clauses and generates structured advisory citing exact circular numbers, clause IDs, and statutory protections without needing paid API keys.
   - **OpenAI API Mode**: Optional integration with `gpt-4o-mini` or `gpt-4o` with system prompt grounding or OpenAI File Search vector store.

4. **Persistent SQLite Loan Journeys**:
   - Saves loan scenarios with full audit scores, APR, and repayment plans.
   - Side-by-side comparison of 2 or 3 loan offers (e.g. Bank vs NBFC vs Fintech).

5. **Dual Experience: Desktop Web Portal & Mobile Companion App**:
   - **🖥️ Web Portal**: Multi-column analytics, interactive charts, and amortization inspection.
   - **📱 Mobile App View**: Haptic-styled companion app experience with bottom navigation, quick-calc dials, and instant compliance scanner.

---

## 🚀 Quick Start on Windows

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ (tested on Node v24)

### Method 1: One-Click Launch
Double-click `start_all.bat` in the project root. It will open two console windows for the backend and frontend.

### Method 2: Manual Terminal Commands

#### Terminal 1 — Backend (FastAPI):
```powershell
cd backend
python run.py
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

#### Terminal 2 — Frontend (Next.js):
```powershell
cd frontend
npm run dev
```
- Web Application & App View: `http://localhost:3000`

---

## ⚙️ Configuration & Optional Paid AI

The application works 100% out-of-the-box in local demo mode without an OpenAI key.
To enable OpenAI API integration:
1. Copy `backend/.env.example` to `backend/.env`
2. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_VECTOR_STORE_ID=
   ```
3. Alternatively, click the **⚙️ Settings** icon in the web portal navigation bar to enter your key directly in the UI.

---

## 📚 Official Setup References
- [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart)
- [OpenAI File Search](https://developers.openai.com/api/docs/guides/tools-file-search)
- [RBI Key Facts Statement Circular](https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12827)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
