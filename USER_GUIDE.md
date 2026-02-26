# Gas Genie — User Guide

Welcome to **Gas Genie**, your AI-powered senior gas engineering assistant. Gas Genie is a voice-first PWA designed to help UK gas and plumbing engineers on site — managing admin, technical lookups, diagnostics, compliance documentation, and more, completely hands-free.

---

## 🎙️ Getting Started

1. **Tap the Microphone** — Click "Talk to Gas Genie" or the floating mic button.
2. **Speak Naturally** — Talk like you would to a colleague on site.
3. **Listen for the Answer** — Gas Genie will process your request and speak the results back.
4. **Use Quick-Ask Buttons** — Tap any chip on the voice screen to instantly start a conversation on that topic.

---

## ⚡ Quick-Ask Buttons

When you open the voice screen, you'll see 18 quick-action chips organized into 4 categories. Tap any chip to start a voice conversation on that topic:

### 🧮 Calculators
- **Calculate gas rate** — Based on meter readings and appliance input
- **Check pipe sizing** — BS 6891 copper pipe sizing for your installation
- **BTU to kW conversion** — Quick unit conversion between BTU and kW
- **Ventilation calculation** — Air vent sizing per BS 5440
- **Pressure drop check** — Verify acceptable pressure drops

### ✅ Compliance
- **Log a CP12 record** — Create a Landlord Gas Safety Record by voice
- **Record commissioning** — Log a commissioning checklist
- **Risk assessment** — Create a risk assessment record
- **Unsafe situation report** — Log an unsafe situation (ID, AR, NCS)
- **RIDDOR report** — Record a RIDDOR-reportable incident

### 🔧 Diagnostics
- **Diagnose a boiler fault** — Describe symptoms and get likely causes
- **Boiler specs lookup** — Get manufacturer specifications for a model
- **Check warranty status** — Verify warranty coverage for an appliance

### 💼 Business
- **Create a quote** — Generate a quotation by voice with itemised pricing
- **Generate an invoice** — Create an invoice from a completed job
- **Log work hours** — Record today's hours worked
- **Log mileage** — Track mileage for your van
- **Check van stock** — See what parts you have and what's running low

---

## 🛠️ Voice Tools

Gas Genie has specialized tools that connect to your database, Google Calendar, and Gmail. Here's what you can ask:

### Log a New Job
Create a job record with auto-generated job number, customer details, and issue description.
> **Try saying:**
> - *"Log a new job for Mrs. Smith at 42 Oak Road. She has a Vaillant ecoTEC with an F28 error code."*
> - *"Create a high-priority job for John Doe. His phone is 07700 900123, the boiler is leaking."*

### Update Job Notes
Add timestamped notes to an existing job while on site.
> **Try saying:**
> - *"Update the notes for job 012. Say: Arrived on site, diverter valve is passing, ordering a new one."*
> - *"Add a note to JOB-005 that the customer wasn't home."*

### Diagnose Boiler Error Codes
Built-in database of common error codes across major manufacturers (Vaillant, Worcester Bosch, Baxi, Ideal, Potterton, Glow-worm, Viessmann, Ferroli).
> **Try saying:**
> - *"What does an F28 error mean on a Vaillant?"*
> - *"Look up error EA on a Worcester Bosch."*

### Look Up Parts & Pricing
Check prices, stock availability, and supplier info for common gas parts.
> **Try saying:**
> - *"How much is a diverter valve for an Ideal Logic?"*
> - *"Check the price and stock for an auto air vent."*

### Check Gas Regulations
Instant access to UK gas safety regulations and Building Regs, now enhanced with AI-powered regulation search (RAG).
> **Try saying:**
> - *"What are the flue termination distance rules next to an opening window?"*
> - *"Ventilation requirements for a 15 kW open-flued boiler?"*
> - *"What is the procedure for an Immediately Dangerous unsafe situation?"*

### Check Calendar Availability
Integrates with Google Calendar to check your schedule.
> **Try saying:**
> - *"When is my next free slot tomorrow?"*
> - *"Check my availability for next Wednesday."*

### Book an Appointment
Create events directly in your Google Calendar.
> **Try saying:**
> - *"Book an appointment for Mrs. Smith tomorrow at 9 AM at 42 Oak Road."*
> - *"Schedule a service for John Doe on the 15th of March at 2 PM."*

### Send Booking Confirmations
Send automated email confirmations via your Gmail account.
> **Try saying:**
> - *"Send a booking confirmation to test@example.com for Mrs. Smith's appointment tomorrow at 9 AM."*

---

## 📸 Photo Diagnosis

Take a photo of a boiler display, error code, flue, installation, or appliance and get an AI-powered diagnosis.

**How to use:**
1. Go to **Diagnose** from the navbar or dashboard
2. **Take a photo** or **upload** an image
3. Gas Genie analyses the image using AI vision
4. You get a structured report: severity level, diagnosis, possible causes, next steps, and safety warnings
5. Tap **"Ask Genie About This"** to continue the conversation by voice

**What you can diagnose:**
- Boiler error code displays
- Installation quality issues
- Flue and vent termination points
- Gas appliance condition

---

## 📊 Dashboard

Your personal engineering dashboard showing:

- **Quick Actions** — Tap to jump to Voice, Diagnose, History, or Photos
- **Today's Stats** — Jobs logged, hours worked, miles driven
- **Recent Quotes** — View and download as PDF
- **Recent Invoices** — Status tracking (Draft, Sent, Paid, Overdue)
- **Gas Safety Records (CP12)** — View, download, and share with customers

---

## 📄 Compliance PDFs

Gas Genie generates professional branded PDFs for:

| Document | What's Included |
|---|---|
| **CP12 Gas Safety Record** | Property details, appliance table, safety checks, pass/fail result |
| **Quotation** | Itemised parts & labour, VAT calculation, validity period |
| **Invoice** | Line items, payment terms, due date, status |

Tap the **PDF button** on any record in the Dashboard to generate and print/download.

---

## 📂 Conversation History

View and search your past voice sessions:

- **Search** — Filter conversations by keyword (searches summaries and transcripts)
- **Date Filter** — Narrow results by date range
- **Export** — Copy or download any conversation transcript

After each voice call, you'll also see quick **Copy / Download / Share** buttons for the transcript.

---

## 📚 Reference Cards (Offline)

Quick-lookup reference data that works even without internet:

| Card | What's Inside |
|---|---|
| **Pipe Sizing (BS 6891)** | Max kW capacity for 8mm–35mm copper pipe at various run lengths |
| **Ventilation (BS 5440)** | Requirements for open-flue, room-sealed, DFE, and flueless appliances |
| **BTU / kW / Watt Conversion** | Quick conversion factors and common boiler sizes |
| **Pressure Testing Guide** | Tightness test procedure, standing pressures (NG + LPG), pass/fail criteria |
| **Common Boiler Error Codes** | Vaillant, Worcester Bosch, Baxi, and Ideal — most common fault codes |
| **Emergency Contacts** | National Gas Emergency, HSE, Gas Safe Register, 999 |

---

## 🔗 Share Documents with Customers

Share CP12s, quotes, and invoices with customers via a secure link:

1. Generate a share link from the Dashboard
2. Send the link to your customer
3. They see a branded, read-only view of the document
4. They can download it as a PDF — **no login required**

Links expire after 30 days for security.

---

## 💡 Tips for Best Results

- **Be Specific** — Provide as much detail as possible in one sentence (e.g., give both the make and error code when diagnosing)
- **Correct Mistakes** — If Gas Genie mishears something, just tell it to correct it
- **Chain Actions** — Ask for a diagnosis, then log a job, then book an appointment — all in one conversation
- **Use Quick-Ask Chips** — Tap a category chip instead of describing what you want from scratch
- **Go Offline** — Reference Cards work without internet for quick lookups on site
- **Export Everything** — Copy or download transcripts, CP12s, quotes, and invoices at any time
