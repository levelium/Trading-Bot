# FvgGold AI Trader — Shared Hosting Deployment Guide

This guide details how to deploy the FvgGold Python AI service on Python-compatible shared hosting providers (such as cPanel with CloudLinux / Passenger, Hostinger, Namecheap, SiteGround, Bluehost, or any host offering the "Setup Python App" feature).

---

## 1. Why Standard Shared Hosting Requires WSGI

Typical shared hosting does **not** allow:
* Running persistent command-line daemons that listen on arbitrary ports (e.g. `8787`).
* Binding to `0.0.0.0` or opening custom firewall ports.
* Root access to install system-wide background services.

Instead, shared hosting uses **WSGI (Web Server Gateway Interface)** via **Phusion Passenger** or **Apache mod_wsgi**. 
The web server (Apache/LiteSpeed/Nginx) receives public requests over standard HTTPS (port 443) and forwards them to Python worker processes on demand. When idle, workers are spun down to conserve memory.

The FvgGold AI service v2.20 includes `passenger_wsgi.py` and `app.py`, which are natively compliant with this architecture.

---

## 2. Step-by-Step cPanel Deployment Instructions

### Step 1: Create the Python Application in cPanel
1. Log in to your cPanel control panel.
2. Under the **Software** section, click **Setup Python App**.
3. Click **Create Application**.
4. Configure the application settings:
   * **Python version**: Select **Python 3.10**, **3.11**, or **3.12**.
   * **Application root**: Enter a directory name, e.g., `fvggold-ai`.
   * **Application URL**: Select your domain or a subdomain (e.g., `api.yourdomain.com` or `yourdomain.com/fvg-ai`).
   * **Application startup file**: Enter `passenger_wsgi.py`.
   * **Application Entry point**: Leave as `application` (the default).
5. Click **Create**. cPanel will create the virtual environment and a default template.

### Step 2: Upload the Application Files
1. Open cPanel **File Manager** (or connect via SFTP).
2. Navigate to the **Application root** folder you specified in Step 1 (e.g., `/home/username/fvggold-ai`).
3. Upload the contents of the `FvgGold-AI-Service/` directory:
   * `app.py`
   * `passenger_wsgi.py`
   * `config.py`
   * `database.py`
   * `schema.sql`
   * `.htaccess`
   * `.env.example`
   * `requirements.txt`

### Step 3: Configure Environment Variables & Secrets
1. In File Manager, copy `.env.example` to `.env`.
2. Generate a secure random token on your local computer using Python:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
3. Edit `.env` and set:
   ```ini
   AI_SERVICE_TOKEN=your_generated_secret_token_at_least_32_chars
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_API_KEYS=your_gemini_api_key_1,your_gemini_api_key_2
   MIN_AI_CONFIDENCE=0.70
   MAX_RISK_PERCENT=0.25
   MAX_SPREAD_POINTS=80
   DB_TYPE=sqlite
   ```
4. Save the file. Ensure permissions on `.env` are set to `600` (readable only by your user account).

### Step 4 (Optional): Configure MySQL Database
If you prefer MySQL over SQLite:
1. Go to cPanel → **MySQL Databases**.
2. Create a database: `username_fvggold`.
3. Create a user: `username_fvguser` with a strong password.
4. Add the user to the database with **ALL PRIVILEGES**.
5. In `.env`, set:
   ```ini
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_USER=username_fvguser
   DB_PASSWORD=your_db_password
   DB_NAME=username_fvggold
   ```
6. In cPanel **Setup Python App**, install the MySQL driver:
   * In the "Configuration files" section, type `PyMySQL` and click **Add**, then click **Run Pip Install**.

### Step 5: Restart the Python Application
1. In cPanel **Setup Python App**, click the **Restart** button at the top of your application page.
2. The web server will reload the application with your new code and environment variables.

---

## 3. Verifying the Deployment from Windows PowerShell

From your local machine or Windows VPS, test your new public HTTPS endpoint:

### 1. Test Public Health Check (No Auth Required)
```powershell
Invoke-RestMethod https://api.yourdomain.com/health
```
**Expected Response:**
```json
{
  "ok": true,
  "service": "FvgGold AI Trader",
  "version": "2.20",
  "model": "gemini-2.5-flash",
  "server_time": 1740000000
}
```

### 2. Test Authenticated Status Check
```powershell
$token = "YOUR_AI_SERVICE_TOKEN"
$headers = @{ "X-Service-Token" = $token }
Invoke-RestMethod -Method Get -Uri "https://api.yourdomain.com/status" -Headers $headers
```
**Expected Response:**
```json
{
  "ok": true,
  "service": "FvgGold AI Trader",
  "version": "2.20",
  "active": true,
  "status": "active",
  "model": "gemini-2.5-flash",
  "configured_keys": 2,
  "database_type": "sqlite"
}
```

---

## 4. Configuring the MT5 EA on Windows VPS

1. Open MetaTrader 5 on your Windows VPS.
2. Go to **Tools → Options → Expert Advisors**.
3. Check **"Allow WebRequest for listed URL"**.
4. Add your exact shared hosting URL:
   ```
   https://api.yourdomain.com
   ```
   *(Ensure there is no trailing slash and protocol is HTTPS)*.
5. In the MT5 chart, open the EA properties (press **F7**):
   * Set `UseAIApproval` = `true`
   * Set `AIServiceBaseURL` = `https://api.yourdomain.com`
   * Set `AIServiceToken` = exact same secret token configured in `.env`
6. Click **OK**.
7. Observe the chart dashboard. Within 5 seconds, it will show:
   ```
   AI Gate: ACTIVE (CONNECTED)
   Status: active
   ```
