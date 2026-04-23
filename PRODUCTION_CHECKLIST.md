# Production Readiness Checklist

Complete this checklist before launching the Worms Math Game to production.

**Last Updated:** 2026-04-23

**Version:** 1.0

---

## Pre-Deployment

### Database Setup

- [ ] Supabase project created
- [ ] Database schema loaded (`schema.sql`)
- [ ] Quiz questions seeded (100+ questions)
- [ ] Test user accounts created
- [ ] Row Level Security (RLS) policies reviewed
- [ ] Database backup configured
- [ ] Connection pooling configured
- [ ] Supabase credentials saved securely

### Server Configuration

- [ ] `server/.env` configured with production values
- [ ] `SUPABASE_URL` set correctly
- [ ] `SUPABASE_KEY` set correctly
- [ ] `PORT` set to 10000 (for Render)
- [ ] `NODE_ENV` set to `production`
- [ ] `CLIENT_URL` set to GitHub Pages URL
- [ ] All dependencies in `package.json`
- [ ] `render.yaml` configured
- [ ] Server health endpoint works (`/health`)

### Client Configuration

- [ ] `client/package.json` homepage URL updated
- [ ] Server URL updated in `networkManager.js`
- [ ] Build script tested (`npm run build`)
- [ ] `.nojekyll` file created
- [ ] Production API endpoints configured
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Mobile responsiveness verified

### Code Quality

- [ ] No console.log in production code (or production mode disables them)
- [ ] No hardcoded credentials
- [ ] All TODO comments resolved
- [ ] Code commented appropriately
- [ ] No unused imports/variables
- [ ] Error boundaries implemented (Phaser)
- [ ] Input validation on client and server

---

## Deployment

### Backend (Render.com)

- [ ] GitHub repository connected to Render
- [ ] Web service created
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`
  - [ ] `CLIENT_URL`
- [ ] First deployment successful
- [ ] Server logs show no errors
- [ ] Health endpoint accessible
- [ ] WebSocket connections working
- [ ] CORS configured correctly

### Frontend (GitHub Pages)

- [ ] GitHub repository pushed
- [ ] Build completed successfully
- [ ] Deployed to `gh-pages` branch
- [ ] GitHub Pages enabled in settings
- [ ] Site accessible at GitHub Pages URL
- [ ] All assets loading (no 404s)
- [ ] Console shows no errors
- [ ] Service worker (if used) working

---

## Post-Deployment Testing

### Functionality Tests

- [ ] Login works
- [ ] Registration works
- [ ] Matchmaking finds opponents
- [ ] Waiting room displays correctly
- [ ] Quiz loads and timer works
- [ ] Quiz answers submit
- [ ] Game scene loads
- [ ] Turn order correct
- [ ] Projectiles sync between clients
- [ ] Explosions sync
- [ ] Damage applies correctly
- [ ] HP bars update
- [ ] Player death handled
- [ ] Win condition triggers
- [ ] Victory screen displays
- [ ] Ratings update
- [ ] Leaderboard refreshes
- [ ] Teacher dashboard accessible

### Multi-Player Tests

- [ ] 2-player match works
- [ ] 4-player FFA works
- [ ] Players can see each other's actions
- [ ] No desync issues
- [ ] Disconnect handled gracefully
- [ ] Reconnect works (if implemented)

### Performance Tests

- [ ] Initial page load < 3 seconds
- [ ] Game runs at stable FPS (30+)
- [ ] No memory leaks (test for 30+ minutes)
- [ ] Server response times < 500ms
- [ ] Database queries optimized
- [ ] WebSocket latency acceptable
- [ ] Mobile performance acceptable

### Security Tests

- [ ] Can't access game without login
- [ ] Can't cheat by manipulating client
- [ ] Server validates all actions
- [ ] SQL injection protected (Supabase)
- [ ] XSS protected
- [ ] CSRF protection (if applicable)
- [ ] Rate limiting on API endpoints
- [ ] Privacy rules enforced (ratings visibility)

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Device Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Large mobile (414x896)

---

## Documentation

- [ ] README.md complete
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] INTEGRATION_TESTING.md updated
- [ ] USER_MANUAL.md created
- [ ] PRODUCTION_CHECKLIST.md (this file) reviewed
- [ ] API documentation available
- [ ] Teacher guide created
- [ ] Student guide created
- [ ] Controls reference available
- [ ] FAQ created

---

## Monitoring & Analytics

### Logging

- [ ] Server logs accessible (Render dashboard)
- [ ] Error logging configured
- [ ] Client errors captured (if using error tracking)
- [ ] Database logs reviewed
- [ ] WebSocket connection logs monitored

### Metrics

- [ ] Active users tracked
- [ ] Match completion rate monitored
- [ ] Average session duration tracked
- [ ] Quiz accuracy metrics available
- [ ] Teacher dashboard usage tracked
- [ ] Leaderboard engagement monitored

### Alerts (Optional)

- [ ] Server down alert
- [ ] High error rate alert
- [ ] Database connection failure alert
- [ ] Disk space alert

---

## Compliance & Legal

- [ ] Privacy policy reviewed (if collecting user data)
- [ ] Terms of service created (if applicable)
- [ ] COPPA compliance (if users under 13)
- [ ] GDPR compliance (if EU users)
- [ ] Age verification (if required)
- [ ] Parental consent (if required)
- [ ] Data retention policy defined

---

## Backup & Recovery

- [ ] Database backups enabled (Supabase daily)
- [ ] Manual backup tested
- [ ] Recovery procedure documented
- [ ] Backup restoration tested
- [ ] Code repository backed up (GitHub)
- [ ] Environment variables documented

---

## Scalability Planning

- [ ] Current limits documented:
  - Render free tier: 750 hours/month
  - Supabase free: 500 MB database, 2 GB bandwidth
  - GitHub Pages: 100 GB bandwidth
- [ ] Upgrade path defined
- [ ] Cost projections calculated
- [ ] Performance bottlenecks identified
- [ ] Caching strategy (if needed)

---

## Communication

### Internal

- [ ] Team notified of launch
- [ ] Roles and responsibilities defined
- [ ] Incident response plan created
- [ ] Communication channels established

### External

- [ ] Users notified of launch
- [ ] Launch announcement prepared
- [ ] Support email/channel created
- [ ] Bug reporting process communicated
- [ ] Feedback collection method established

---

## Launch Day

### Pre-Launch (T-1 hour)

- [ ] All servers running
- [ ] Database accessible
- [ ] Test login successful
- [ ] Monitoring active
- [ ] Team on standby

### Launch (T=0)

- [ ] Announcement sent
- [ ] URL shared
- [ ] Initial users can access
- [ ] No critical errors

### Post-Launch (T+1 hour)

- [ ] Monitor error logs
- [ ] Check server resources
- [ ] Verify user registrations
- [ ] Monitor match completions
- [ ] Respond to user feedback

### Post-Launch (T+24 hours)

- [ ] Review analytics
- [ ] Address any bugs
- [ ] Collect user feedback
- [ ] Document issues
- [ ] Plan hotfixes if needed

---

## Known Issues (To Document)

- [ ] Free tier server sleeps after 15 min (expected)
- [ ] First request may take 30-60s to wake server
- [ ] Quiz timer may drift slightly on slow connections
- [ ] Mobile browser compatibility varies

---

## Future Enhancements (Post-Launch)

- [ ] Additional quiz topics
- [ ] More worm characters
- [ ] Team vs team (2v2, 3v3)
- [ ] Power-ups
- [ ] Achievements
- [ ] Profile customization
- [ ] Replay system
- [ ] Spectator mode
- [ ] Tournament mode
- [ ] Social features (friends, chat)

---

## Sign-Off

**Product Owner:** ______________________ Date: __________

**Technical Lead:** ______________________ Date: __________

**QA Lead:** ______________________ Date: __________

**Deployment Engineer:** ______________________ Date: __________

---

## Launch Approval

**Status:** [ ] Approved [ ] Conditionally Approved [ ] Not Approved

**Conditions:**
1. ________________________________________________________________
2. ________________________________________________________________
3. ________________________________________________________________

**Approval Date:** __________

**Approved By:** ______________________

---

## Post-Launch Review (1 week after launch)

**Date:** __________

**Active Users:** __________

**Matches Played:** __________

**Average Session Duration:** __________

**Bug Count:** __________

**User Feedback Summary:**
________________________________________________________________
________________________________________________________________
________________________________________________________________

**Action Items:**
1. ________________________________________________________________
2. ________________________________________________________________
3. ________________________________________________________________

---

**PRODUCTION STATUS:**

[ ] Not Ready
[ ] Ready with Conditions
[ ] Ready for Launch
[ ] Launched
[ ] Post-Launch Monitoring
