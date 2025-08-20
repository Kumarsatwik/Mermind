# Deployment Guide for Vercel

## Required Environment Variables

Set these environment variables in your Vercel dashboard:

### Database
```
DATABASE_URL=postgresql://username:password@localhost:5432/database
```

### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key  
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### AI APIs (Required for AI features)
```
GROQ_API_KEY=your-groq-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### NextAuth (Required for authentication)
```
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### Prisma (For Vercel deployment)
```
PRISMA_GENERATE_DATAPROXY=true
```

## Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables listed above

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy" and wait for the build to complete

## Common Issues & Solutions

### 1. Prisma Issues
- Ensure `DATABASE_URL` is set correctly
- Make sure `PRISMA_GENERATE_DATAPROXY=true` is set
- Verify the postinstall script runs `prisma generate`

### 2. Environment Variables
- Double-check all required environment variables are set in Vercel
- Ensure `NEXTAUTH_URL` matches your Vercel domain
- Verify API keys are valid and have proper permissions

### 3. Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json
- Verify TypeScript compilation passes locally

### 4. Runtime Errors
- Check function logs in Vercel dashboard
- Ensure database is accessible from Vercel
- Verify Supabase configuration is correct

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Authentication works (sign in/sign up)
- [ ] AI diagram generation works
- [ ] Database operations work
- [ ] All environment variables are set
- [ ] SSL certificate is active
- [ ] Custom domain configured (if applicable)

## Monitoring

- Use Vercel Analytics for performance monitoring
- Check function logs for runtime errors
- Monitor database connection limits
- Set up uptime monitoring for critical endpoints
