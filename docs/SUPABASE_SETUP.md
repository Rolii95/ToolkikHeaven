# 🚀 Instructions for Connecting Real Supabase Database

## Step 1: Update Environment Variables

Replace the values in your `.env.local` file with your actual Supabase credentials:

```bash
# Replace these with your actual Supabase project credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 2: Find Your Supabase Credentials

1. Go to https://app.supabase.com/project/your-project/settings/api
2. Copy the **Project URL**
3. Copy the **anon/public key**
4. Copy the **service_role key** (keep this secure!)

## Step 3: Populate Sample Data

Once connected, you can add sample reviews to your database using the SQL editor in Supabase:

```sql
-- Insert sample reviews for product 1 (Premium Wireless Headphones)
INSERT INTO product_reviews (product_id, user_id, rating, review_text, helpful_votes) VALUES
('1', 'user-1', 5, 'Absolutely fantastic product! The quality exceeded my expectations and delivery was lightning fast.', 12),
('1', 'user-2', 4, 'Great headphones with excellent sound quality. The noise cancellation works really well.', 8),
('1', 'user-3', 5, 'Perfect for my daily commute. Battery life is amazing and they are very comfortable.', 15);

-- Insert sample reviews for product 2 (Smart Fitness Watch)
INSERT INTO product_reviews (product_id, user_id, rating, review_text, helpful_votes) VALUES
('2', 'user-4', 5, 'Perfect fitness watch! Tracks everything I need and the battery lasts for days.', 10),
('2', 'user-5', 4, 'Great features and accurate tracking. The app could use some improvements though.', 6);

-- Insert sample reviews for product 3 (Ergonomic Office Chair)
INSERT INTO product_reviews (product_id, user_id, rating, review_text, helpful_votes) VALUES
('3', 'user-6', 4, 'Very comfortable office chair. The ergonomic design has really helped with my back pain.', 9),
('3', 'user-7', 5, 'Best chair I have ever owned! Assembly was easy and build quality is excellent.', 14);
```

## Step 4: Create User Profiles (Optional)

Add sample user profiles for better social proof:

```sql
-- Insert sample user profiles
INSERT INTO user_profiles (id, display_name, avatar_url) VALUES
('user-1', 'Sarah Johnson', NULL),
('user-2', 'Mike Chen', NULL),
('user-3', 'Emma Davis', NULL),
('user-4', 'Alex Rodriguez', NULL),
('user-5', 'Lisa Thompson', NULL),
('user-6', 'David Kim', NULL),
('user-7', 'Rachel Green', NULL);
```

## Step 5: Test the Connection

1. Restart your dev server: `npm run dev`
2. Visit http://localhost:3000
3. Check product pages for real reviews from your database
4. Try submitting a new review using the "Write a Review" button

## 🔒 Security Notes

- Never commit real Supabase credentials to git
- The service_role key has admin access - keep it secure
- In production, use environment variables or secret management

## 🎯 Current Status

The application is currently working with mock data as a fallback. Once you add your real Supabase credentials, it will automatically connect to your database while maintaining the same user experience.

## 📊 Features Ready for Production

✅ Complete review system with star ratings
✅ Real-time review submission and display  
✅ Social proof integration on product cards
✅ Authentication-aware review submission
✅ Graceful fallback to mock data
✅ Production-ready database schema
✅ Row Level Security (RLS) policies