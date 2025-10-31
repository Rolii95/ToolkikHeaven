# Database Setup Guide - Aurora Commerce

## 🚀 Quick Setup

You've provided the Supabase connection string: 
```
postgresql://postgres:[YOUR_PASSWORD]@db.iyenjqsvxizjucmjukvj.supabase.co:5432/postgres
```

### Step 1: Update Your Password

1. **Replace `[YOUR_PASSWORD]`** in your `.env.local` file with your actual Supabase database password
2. You can find your database password in:
   - Supabase Dashboard → Project Settings → Database → Connection String

### Step 2: Run Database Setup

Choose one of these methods:

#### Option A: Automated Script (Recommended)
```bash
./scripts/setup-database.sh
```

#### Option B: Manual Setup via Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to your project: `iyenjqsvxizjucmjukvj`
3. Navigate to SQL Editor
4. Copy and paste the contents of `database/chat-support-setup.sql`
5. Run the script

#### Option C: Command Line (if psql is installed)
```bash
# First, update your DATABASE_URL in .env.local with the real password
# Then run:
psql $DATABASE_URL -f database/chat-support-setup.sql
```

## 📋 What Gets Created

The chat support setup will create these tables:

### Core Tables
- **`chat_sessions`** - Stores chat conversations between customers and agents
- **`chat_messages`** - Individual messages within chat sessions
- **`contact_submissions`** - Contact form submissions for offline support
- **`business_hours_config`** - Configurable business hours for chat availability
- **`chat_agent_availability`** - Tracks which support agents are online

### Features Included
- ✅ **Row Level Security (RLS)** - Secure access control
- ✅ **Indexes** - Optimized for performance
- ✅ **Triggers** - Auto-updating timestamps
- ✅ **Functions** - Ticket ID generation
- ✅ **Default Data** - Business hours configuration

## 🔗 Connection Details

Based on your connection string:
- **Project ID**: `iyenjqsvxizjucmjukvj`
- **Region**: Supabase Cloud
- **Database**: `postgres`
- **Port**: `5432`

## 🛠️ Environment Variables

Make sure these are set in your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://iyenjqsvxizjucmjukvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Connection
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.iyenjqsvxizjucmjukvj.supabase.co:5432/postgres
```

## 🧪 Testing the Setup

After running the database setup:

1. **Check Tables Created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'chat_%';
   ```

2. **Test Chat Functionality**:
   - Start your development server: `npm run dev`
   - Visit your application and click the chat widget
   - Try sending a message during business hours
   - Try the contact form outside business hours

3. **Verify API Endpoints**:
   ```bash
   curl http://localhost:3000/api/chat/business-hours
   curl http://localhost:3000/api/chat/messages
   ```

## 🔧 Troubleshooting

### Common Issues:

1. **"relation does not exist" errors**:
   - Run the database setup script
   - Check that tables were created in Supabase dashboard

2. **Connection refused**:
   - Verify your DATABASE_URL password
   - Check that your IP is whitelisted in Supabase (if applicable)

3. **Permission denied**:
   - Ensure RLS policies are set up correctly
   - Check that the service role key has proper permissions

### Getting Help:

1. **Supabase Dashboard**: https://app.supabase.com/project/iyenjqsvxizjucmjukvj
2. **Table Editor**: View and edit data directly
3. **SQL Editor**: Run custom queries
4. **Logs**: Check for any database errors

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

Once you've completed the database setup, your chat support system will be fully functional with:
- Real-time messaging capabilities
- Business hours detection
- Contact form fallback
- Session management
- Message history
- Agent availability tracking

🎉 **Ready to go!** Your Aurora Commerce chat support system is now database-ready!