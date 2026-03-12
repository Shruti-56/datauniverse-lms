# Third-Party Services Setup Guide

This guide provides step-by-step instructions to set up AWS S3, Razorpay, and Gmail SMTP for DataUniverse LMS.

---

# 📦 Part 1: AWS S3 Setup (Video Storage)

## Step 1: Create AWS Account

1. Go to **https://aws.amazon.com/**
2. Click **"Create an AWS Account"**
3. Enter email address and choose account name
4. Verify email with OTP
5. Enter contact information
6. Add payment method (credit/debit card required for verification)
   - Note: You won't be charged if you stay in free tier
7. Complete identity verification (phone number)
8. Select **"Basic Support - Free"** plan
9. Account creation complete!

## Step 2: Sign In to AWS Console

1. Go to **https://console.aws.amazon.com/**
2. Sign in with your root email and password
3. You'll see the AWS Management Console

## Step 3: Create S3 Bucket

1. In the search bar, type **"S3"** and click on it
2. Click **"Create bucket"**
3. Configure bucket:
   ```
   Bucket name: datauniverse-videos-yourname
   (Must be globally unique, use your name/company)
   
   AWS Region: Asia Pacific (Mumbai) ap-south-1
   (Choose nearest to your users)
   ```
4. **Object Ownership**: Select "ACLs disabled (recommended)"
5. **Block Public Access settings**:
   - ✅ UNCHECK "Block all public access"
   - Check the acknowledgment box
   - (We use signed URLs, so objects are still protected)
6. **Bucket Versioning**: Disable (optional)
7. **Default encryption**: Enable with SSE-S3
8. Click **"Create bucket"**

## Step 4: Configure CORS for Bucket

1. Click on your newly created bucket
2. Go to **"Permissions"** tab
3. Scroll down to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"**
5. Paste this configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:8080",
            "http://localhost:5173",
            "http://localhost:3000",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

6. Click **"Save changes"**

## Step 5: Create IAM User (for API access)

1. In search bar, type **"IAM"** and click on it
2. In left sidebar, click **"Users"**
3. Click **"Create user"**
4. Enter username: `datauniverse-s3-user`
5. Click **"Next"**
6. Select **"Attach policies directly"**
7. Search for and select: **"AmazonS3FullAccess"**
8. Click **"Next"**
9. Click **"Create user"**

## Step 6: Create Access Keys

1. Click on the user you just created
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"**
7. Add description (optional): "DataUniverse Backend"
8. Click **"Create access key"**
9. **⚠️ IMPORTANT**: Copy and save both:
   - **Access key ID**: `AKIA...............`
   - **Secret access key**: `wJalr...............`
   
   (You can only see the secret key once!)

10. Click **"Done"**

## Step 7: Update Your .env File

Add these to `backend/.env`:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...your_access_key...
AWS_SECRET_ACCESS_KEY=wJalr...your_secret_key...
AWS_S3_BUCKET=datauniverse-videos-yourname
```

## Step 8: Test Upload (Optional)

1. Start your backend: `cd backend && npm run dev`
2. Login as admin
3. Create a course → Add module → Add video
4. Try uploading a small video file
5. Check S3 bucket - file should appear

---

# 💳 Part 2: Razorpay Setup (Payments)

## Step 1: Create Razorpay Account

1. Go to **https://dashboard.razorpay.com/signup**
2. Enter your email and create password
3. Verify email with OTP
4. You'll see the Razorpay Dashboard

## Step 2: Complete Basic Profile

1. Go to **"Settings"** (gear icon in sidebar)
2. Click **"Profile"**
3. Fill in:
   - Business name: DataUniverse
   - Business type: Select appropriate
   - Your name and phone number
4. Click **"Save"**

## Step 3: Get Test API Keys

1. Go to **"Settings"** → **"API Keys"**
2. You'll see **"Test Mode"** is enabled by default
3. Click **"Generate Test Key"**
4. You'll see:
   - **Key Id**: `rzp_test_xxxxxxxxxxxx`
   - **Key Secret**: Click to reveal, then copy
   
5. **⚠️ IMPORTANT**: Copy both keys immediately!

## Step 4: Update Your .env Files

**Backend (`backend/.env`):**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Frontend (`.env`):**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

## Step 5: Test Payment (Test Mode)

Use these test credentials in Razorpay checkout:

**Test Card:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Name: Any name
```

**Test UPI:**
```
UPI ID: success@razorpay
```

**Test Netbanking:**
```
Select any bank → Use credentials shown
```

## Step 6: Going Live (Production)

When ready for real payments:

### 6.1 Complete KYC
1. Go to **"Settings"** → **"Business Settings"**
2. Click **"Activate Account"**
3. Fill in:
   - Business details (PAN, GST if applicable)
   - Bank account details
   - Upload documents:
     - PAN Card
     - Business proof
     - Address proof
4. Submit for verification (takes 2-3 business days)

### 6.2 Get Live Keys
1. After KYC approval, toggle to **"Live Mode"**
2. Go to **"Settings"** → **"API Keys"**
3. Click **"Generate Live Key"**
4. Replace test keys with live keys in your `.env` files

### 6.3 Website URL for KYC
If asked for website URL before hosting:
- You can use a free hosting temporarily:
  - Netlify: https://netlify.com
  - Vercel: https://vercel.com
  - Railway: https://railway.app
- Or explain to Razorpay support that site is under development

---

# 📧 Part 3: Email Setup (Outlook or Gmail)

You can use **Outlook** (e.g. admin@datauniverse.in) or **Gmail**. Follow either **Part 3a (Outlook)** or **Part 3b (Gmail)**.

---

## Part 3a: Outlook / Microsoft 365 (e.g. admin@datauniverse.in)

Use this if your sending address is **admin@datauniverse.in** (or any Outlook / Microsoft 365 mailbox).

### Step 1: Use your Outlook account

- Your email: **admin@datauniverse.in** (or your Outlook address).
- You’ll use this account’s password, or an **app password** if you have multi-factor authentication (MFA) enabled.

### Step 2: Allow SMTP / “Authenticated SMTP” (if required)

Some Microsoft 365 / Outlook setups require “Authenticated SMTP” or “SMTP AUTH” to be enabled:

1. Log in to **Microsoft 365 admin center** (if you manage the tenant) or ask your IT admin.
2. Go to **Users** → **Active users** → select the user (e.g. admin@datauniverse.in) → **Mail** → **Manage email apps**.
3. Ensure **Authenticated SMTP** is **enabled** (checked). Save if you changed it.

If you don’t have admin access, try with your normal password first; if you get “Authentication failed”, ask your admin to enable SMTP AUTH for this mailbox.

### Step 3: App password (if you have MFA / 2FA)

If **admin@datauniverse.in** has two-factor authentication:

1. Go to **https://account.microsoft.com/security** (signed in as that account).
2. Under **Security basics** → **App passwords** (or **Advanced security options**), create a new **App password**.
3. Use that app password in `SMTP_PASS` instead of your normal account password.

If there is no 2FA, you can use your normal Outlook password in `SMTP_PASS`.

### Step 4: Update `backend/.env`

Add or replace with these values in **`backend/.env`**:

```env
# Outlook / Microsoft 365 (admin@datauniverse.in)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@datauniverse.in
SMTP_PASS=your_password_or_app_password
SMTP_FROM=DataUniverse <admin@datauniverse.in>
```

Replace `your_password_or_app_password` with the account password or the app password from Step 3.

### Step 5: Test email

1. Start backend: `cd backend && npm run dev`
2. Look for: **✅ Email service ready**
3. Test: register a new user (welcome email) or use “Forgot password” (reset email).

### Step 6: Troubleshooting Outlook

| Issue | What to do |
|-------|------------|
| **“Authentication failed”** | Enable **SMTP AUTH** for the mailbox (Step 2). If MFA is on, use an **App password** (Step 3). |
| **“Connection timeout” / “ENOTFOUND”** | Confirm `SMTP_HOST=smtp.office365.com` and your network allows outbound port **587**. |
| **Emails not received** | Check recipient spam folder. For production, add SPF/DKIM for datauniverse.in in DNS. |

---

## Part 3b: Gmail SMTP Setup (Alternative)

### Step 1: Use Existing Gmail or Create New

1. Go to **https://mail.google.com/**
2. Create new account or use existing one
3. Recommended: Create a dedicated account like `noreply.datauniverse@gmail.com`

### Step 2: Enable 2-Factor Authentication

**This is REQUIRED to generate App Passwords**

1. Go to **https://myaccount.google.com/**
2. Click **"Security"** in left sidebar
3. Under "How you sign in to Google", click **"2-Step Verification"**
4. Click **"Get Started"**
5. Enter your password
6. Choose verification method:
   - **Recommended**: Use your phone number for SMS codes
7. Enter the verification code sent to your phone
8. Click **"Turn On"**

### Step 3: Generate App Password

1. Go to **https://myaccount.google.com/apppasswords**
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. You might need to enter your password again
3. Under "Select app", choose **"Mail"**
4. Under "Select device", choose **"Other (Custom name)"**
5. Enter name: `DataUniverse`
6. Click **"Generate"**
7. You'll see a 16-character password like: `abcd efgh ijkl mnop`
8. **⚠️ IMPORTANT**: Copy this password (remove spaces)!
   - This is shown only once!
   - Example: `abcdefghijklmnop`

### Step 4: Update Your .env File (Gmail)

Add these to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=DataUniverse <your_email@gmail.com>
```

Replace:
- `your_email@gmail.com` with your actual Gmail
- `abcdefghijklmnop` with your App Password (no spaces)

### Step 5: Test Email Sending

1. Start your backend: `cd backend && npm run dev`
2. Look for: `✅ Email service ready`
3. Test by:
   - Registering a new user (welcome email)
   - Using forgot password (reset email)

### Step 6: Troubleshooting Gmail

### Issue: "Email service not configured"
- Check SMTP_USER and SMTP_PASS are set correctly
- Make sure App Password has no spaces

### Issue: "Authentication failed"
- Make sure 2FA is enabled
- Generate a new App Password
- Don't use your regular Gmail password

### Issue: "Emails going to spam"
- Add SPF record to your domain (for production)
- Ask recipients to mark as "Not Spam"
- Use a professional email service for production (SendGrid, Mailgun)

---

# 📋 Final Checklist

After completing all setups, your `backend/.env` should look like:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/DataUniverse"

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# AWS S3 ✅
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_S3_BUCKET=datauniverse-videos-yourname

# Razorpay ✅
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Email (Outlook) ✅
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@datauniverse.in
SMTP_PASS=your_password_or_app_password
SMTP_FROM=DataUniverse <admin@datauniverse.in>

# URLs
FRONTEND_URL=http://localhost:8080
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

And your `.env` (frontend):

```env
VITE_API_URL=http://localhost:3001/api
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

# 🎉 All Done!

Your DataUniverse LMS is now fully configured with:
- ✅ AWS S3 for video storage
- ✅ Razorpay for payments
- ✅ Email (Outlook admin@datauniverse.in or Gmail)

**Test each feature:**
1. Upload a video (tests S3)
2. Buy a course with test card (tests Razorpay)
3. Register new account (tests email)
4. Use forgot password (tests email)

---

# 💡 Pro Tips

## For Production:

### AWS S3
- Set up CloudFront CDN for faster video delivery
- Enable S3 lifecycle rules to manage storage costs
- Use separate buckets for dev/staging/production

### Razorpay
- Enable webhook for payment confirmations
- Set up refund automation
- Enable payment links for manual invoicing

### Email
- Use professional service (SendGrid/Mailgun) for better deliverability
- Set up custom domain email (admin@yourdomain.com)
- Configure SPF, DKIM, DMARC records

---

**Need help? Check the logs:**
```bash
# Backend logs (Terminal 1)
cd backend && npm run dev

# Look for errors or success messages
```
