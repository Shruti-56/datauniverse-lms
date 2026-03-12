What I've Created
1. Video Upload System
Admin Course Edit Page (/admin/courses/:id/edit) - Manage modules and videos
Video Upload Page (/admin/videos/:id/upload) - Upload videos to S3
Videos are uploaded directly to S3 from the browser (faster, no server bottleneck)
2. S3 Integration
Presigned URLs for secure uploads
Signed URLs for video playback (2-hour expiry)
Videos stored in your S3 bucket
AWS S3 Setup Required
Step 1: Create S3 Bucket
Go to AWS Console → S3
Create bucket: datauniverse-videos (or your preferred name)
Region: Choose closest to your users
Uncheck "Block all public access" (we use signed URLs)
Step 2: Configure CORS on S3 Bucket
Go to Bucket → Permissions → CORS and add:
[    {        "AllowedHeaders": ["*"],        "AllowedMethods": ["GET", "PUT", "POST"],        "AllowedOrigins": ["http://localhost:8080", "https://yourdomain.com"],        "ExposeHeaders": ["ETag"]    }]
Step 3: Create IAM User
Go to IAM → Users → Create user
Attach policy: AmazonS3FullAccess (or create custom policy)
Create access key and save credentials
Step 4: Update Backend .env
AWS_ACCESS_KEY_ID=your-access-keyAWS_SECRET_ACCESS_KEY=your-secret-keyAWS_REGION=us-east-1AWS_S3_BUCKET=datauniverse-videos
How to Upload Videos
Login as Admin
Go to Courses
Click Videos button on a course
Click Upload on any video
Select your video file (MP4, WebM, MOV)
Video uploads directly to S3
Run the Updated App
# Re-seed databasecd backendnpm run seed# Restart backendnpm run dev# Restart frontend (new terminal)cd ..npm run dev
Test Credentials
Role	Email	Password
Admin	admin@datauniverse.com	Admin123!
Student	student@datauniverse.com	Student123!
Do you want me to help you configure AWS S3, or do you have questions about the video upload flow?