# UCC Helpdesk - Complete Testing Guide

This guide will help you thoroughly test all features of the helpdesk platform.

## Prerequisites

✅ Supabase SQL script has been run
✅ App is running (`npm run dev`)
✅ Browser console is open (F12 → Console)

---

## Test 1: Student Signup Flow

### Steps:
1. Navigate to `http://localhost:5173/student-signup`
2. Fill in the form:
   - **Full Name**: Test Student
   - **Student ID**: 10224055
   - **Email**: teststudent@ucc.edu.gh
   - **Password**: test123456
3. Click **Sign Up**

### Expected Results:
- ✅ Alert: "Account created! Please log in."
- ✅ Redirected to `/student-login`
- ✅ Check Supabase → Authentication → Users (new user should appear)
- ✅ Check Supabase → Table Editor → profiles (profile auto-created with role='student')

### Console Logs to Check:
```
Auth: Profile not found, creating default student profile...
Auth: Profile created successfully
```

---

## Test 2: Student Login Flow

### Steps:
1. Navigate to `http://localhost:5173/student-login`
2. Enter credentials:
   - **Email**: teststudent@ucc.edu.gh
   - **Password**: test123456
3. Click **Sign In**

### Expected Results:
- ✅ Redirected to `/dashboard`
- ✅ See student dashboard with profile info
- ✅ No "Profile Loading" screen
- ✅ Navigation bar shows student email

### Console Logs to Check:
```
Auth: Starting initialization...
Auth: Fetching session...
Auth: Fetching profile for user: [uuid]
Auth: Profile loaded: student
```

---

## Test 3: Submit Ticket

### Steps:
1. From dashboard, click **Submit New Request**
2. Fill in the form:
   - **Type**: Portal Issues
   - **Subject**: Cannot access course materials
   - **Description**: I'm unable to view my course materials for MATH101
   - **Priority**: High
3. (Optional) Test voice recording:
   - Click microphone icon
   - Allow microphone access
   - Record a short message
   - Stop recording
4. (Optional) Test file attachment:
   - Click "Attach File"
   - Select an image or PDF
5. Click **Submit Ticket**

### Expected Results:
- ✅ Success message appears
- ✅ Redirected to ticket tracking page
- ✅ Ticket appears in Supabase → tickets table
- ✅ Email notification sent (if EmailJS configured)

### Console Logs to Check:
```
Ticket submitted successfully
AI suggestion generated (if Gemini API key is valid)
```

---

## Test 4: Track Ticket

### Steps:
1. Navigate to `/track-ticket`
2. Enter the ticket ID from previous test
3. Click **Track Ticket**

### Expected Results:
- ✅ Ticket details displayed
- ✅ Status shown (Open, In Progress, Resolved)
- ✅ Timeline of updates visible
- ✅ Can add messages to ticket

---

## Test 5: Admin Login

### Steps:
1. Navigate to `http://localhost:5173/login`
2. Try master admin bypass:
   - **Email**: master@ucc.edu.gh
   - **Password**: israel_master
3. Click **Sign In**

### Expected Results:
- ✅ Redirected to `/admin`
- ✅ See admin dashboard with all tickets
- ✅ Can view analytics
- ✅ Can assign tickets to agents

---

## Test 6: Voice Recording Feature

### Steps:
1. Go to Submit Ticket page
2. Click the microphone icon
3. Allow microphone permissions
4. Record for 5 seconds
5. Click stop
6. Play back the recording

### Expected Results:
- ✅ Microphone permission prompt appears
- ✅ Recording indicator shows
- ✅ Audio playback works
- ✅ Recording saved with ticket

### Troubleshooting:
- If microphone doesn't work: Check browser permissions
- If recording fails: Check console for errors

---

## Test 7: File Attachments

### Steps:
1. Go to Submit Ticket page
2. Click "Attach File" button
3. Select a file (image, PDF, or document)
4. Verify file preview appears
5. Submit ticket

### Expected Results:
- ✅ File preview shows
- ✅ File size displayed
- ✅ Can remove attachment before submitting
- ✅ File URL saved in ticket

---

## Test 8: AI Suggestions (Gemini)

### Prerequisites:
- Valid Gemini API key in `.env`

### Steps:
1. Submit a ticket with description: "I forgot my password"
2. Wait for AI suggestion to appear

### Expected Results:
- ✅ AI suggestion box appears
- ✅ Helpful suggestion provided
- ✅ Can dismiss suggestion

### Troubleshooting:
- Check `.env` file has `VITE_GEMINI_API_KEY`
- Check console for API errors

---

## Test 9: Email Notifications (EmailJS)

### Prerequisites:
- EmailJS configured in `.env`

### Steps:
1. Submit a new ticket
2. Check the email inbox

### Expected Results:
- ✅ Confirmation email received
- ✅ Email contains ticket details
- ✅ Email has tracking link

### Troubleshooting:
- Verify EmailJS credentials in `.env`
- Check EmailJS dashboard for delivery status

---

## Test 10: Multi-Language Support

### Steps:
1. Look for language selector in navigation
2. Switch between EN, FR, TW
3. Navigate through different pages

### Expected Results:
- ✅ Language changes immediately
- ✅ All UI text translates
- ✅ Language preference persists

---

## Test 11: Dark/Light Theme Toggle

### Steps:
1. Click the sun/moon icon in navigation
2. Toggle between themes
3. Refresh the page

### Expected Results:
- ✅ Theme changes instantly
- ✅ All colors update properly
- ✅ Theme preference persists after refresh

---

## Test 12: PWA Installation

### Steps:
1. Look for install prompt in browser
2. Click "Install" or use browser menu
3. Install the app

### Expected Results:
- ✅ Install prompt appears
- ✅ App installs successfully
- ✅ App icon appears on desktop/home screen
- ✅ App works offline (basic functionality)

---

## Test 13: Onboarding Tour

### Steps:
1. Sign up as a new student
2. Login for the first time
3. Onboarding tour should start automatically

### Expected Results:
- ✅ Tour overlay appears
- ✅ Highlights key features
- ✅ Can skip or complete tour
- ✅ Tour doesn't show again after completion

---

## Test 14: Responsive Design

### Steps:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

### Expected Results:
- ✅ Layout adapts to screen size
- ✅ Navigation becomes hamburger menu on mobile
- ✅ Tables scroll horizontally on mobile
- ✅ All buttons are accessible

---

## Test 15: Admin Features

### Steps:
1. Login as admin
2. View all tickets
3. Assign a ticket to yourself
4. Update ticket status
5. Add internal notes
6. View analytics

### Expected Results:
- ✅ Can see all student tickets
- ✅ Can filter by status/priority
- ✅ Can assign tickets
- ✅ Can update status
- ✅ Analytics charts display correctly

---

## Common Issues & Solutions

### Issue: "Profile Loading" persists
**Solution**: Run the Supabase SQL script, then logout and login again

### Issue: Voice recording doesn't work
**Solution**: 
- Check browser permissions
- Use HTTPS or localhost (required for microphone access)

### Issue: AI suggestions not appearing
**Solution**: Verify `VITE_GEMINI_API_KEY` in `.env` file

### Issue: Email notifications not sending
**Solution**: Verify EmailJS credentials in `.env` file

### Issue: Can't submit tickets
**Solution**: Check Supabase RLS policies are set correctly

---

## Testing Checklist

Use this checklist to track your testing progress:

- [ ] Student signup works
- [ ] Student login works
- [ ] Submit ticket works
- [ ] Track ticket works
- [ ] Admin login works
- [ ] Voice recording works
- [ ] File attachments work
- [ ] AI suggestions work
- [ ] Email notifications work
- [ ] Multi-language works
- [ ] Theme toggle works
- [ ] PWA installation works
- [ ] Onboarding tour works
- [ ] Responsive design works
- [ ] Admin features work

---

## Next Steps

After completing all tests:
1. ✅ Document any bugs found
2. ✅ Fix critical issues
3. ✅ Proceed to production deployment
