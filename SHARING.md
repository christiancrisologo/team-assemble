# Social Sharing Setup for Team Assemble

## Overview

This app now supports rich previews when sharing presentation links on social media platforms like Twitter, Slack, Discord, etc. When you share a presentation URL, it will display:

- Team name and sprint role information
- Visual preview with team member avatars
- Role assignments for the current sprint

## Features Implemented

### 1. Dynamic Meta Tags
- Uses `react-helmet-async` to dynamically update Open Graph and Twitter Card meta tags
- Each presentation page has unique meta tags based on the team and sprint data
- SEO-friendly with proper titles and descriptions

### 2. Screenshot Capture
- Users can capture a screenshot of the final presentation results
- Download the image locally
- Copy the image to clipboard for sharing
- Native share functionality on supported devices (mobile)

### 3. URL Sharing
- Copy shareable presentation URLs with replay IDs
- Supports public viewing without authentication
- URLs preserve the exact sprint state for replay

### 4. Supabase Edge Function (Optional)
- Server-side OG image generation using Deno
- Creates dynamic preview images based on sprint data
- Located at `/supabase/functions/og-image/index.ts`

## How to Use

### For Users

#### 1. Generate a Screenshot
1. Complete a sprint presentation
2. When you reach the final "Team assemble!" screen
3. Click "Prepare to Share" button
4. Wait for the screenshot to generate
5. Use the buttons to:
   - **Download Image**: Save locally
   - **Copy Image**: Copy to clipboard
   - **Share results**: Use native share (mobile)
   - **Copy Share Link**: Copy the URL for sharing

#### 2. Share the URL
- The presentation URL includes a `?replay=<sprint-id>` parameter
- Anyone with this URL can view the presentation (no login required)
- The presentation will display the exact team composition from that sprint

### For Developers

#### Deploy Supabase Edge Function (Optional)

To enable server-side OG image generation:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref <your-project-ref>
```

4. Deploy the function:
```bash
supabase functions deploy og-image
```

5. Update the `ogImageUrl` in `Presentation.tsx`:
```typescript
const ogImageUrl = replayId 
  ? `https://<your-project-ref>.supabase.co/functions/v1/og-image?sprint=${replayId}`
  : `${baseUrl}/social-preview.png`;
```

#### Static OG Image Alternative

If you don't want to set up the edge function:

1. Create a static preview image (1200x630px)
2. Save it as `public/social-preview.png`
3. The app will use this as the default OG image

## Testing Social Previews

### Twitter
1. Share your presentation URL on Twitter
2. The card should automatically appear with your image

### Slack
1. Paste the presentation URL in a Slack message
2. Slack will unfurl the link with preview

### Facebook/LinkedIn
Use debugging tools:
- Facebook: https://developers.facebook.com/tools/debug/
- LinkedIn: https://www.linkedin.com/post-inspector/

### Discord
Just paste the URL - Discord automatically generates previews

## Technical Details

### Meta Tags Structure

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="[presentation-url]" />
<meta property="og:title" content="Team [Name] - Sprint Presentation" />
<meta property="og:description" content="Check out the sprint roles..." />
<meta property="og:image" content="[image-url]" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="[presentation-url]" />
<meta property="twitter:title" content="Team [Name] - Sprint Presentation" />
<meta property="twitter:description" content="Check out the sprint roles..." />
<meta property="twitter:image" content="[image-url]" />
```

### Image Requirements

For optimal social media previews:
- **Size**: 1200x630 pixels (recommended)
- **Format**: PNG or JPEG
- **Max file size**: 5MB (Twitter), 8MB (Facebook)
- **Aspect ratio**: 1.91:1

## Troubleshooting

### Preview not showing
1. Check that meta tags are properly rendered (view page source)
2. Verify image URL is publicly accessible
3. Clear social media cache using debug tools
4. Wait a few minutes for social platforms to fetch the new metadata

### Edge function not working
1. Verify Supabase function is deployed: `supabase functions list`
2. Check function logs: `supabase functions logs og-image`
3. Test the endpoint directly in your browser
4. Ensure CORS headers are properly set

### Screenshot quality issues
- The screenshot uses `html2canvas` with 2x scale for better quality
- For best results, wait for animations to complete before capturing
- Consider adjusting the scale factor in the code if needed

## Future Enhancements

- [ ] Add QR code generation for easy mobile sharing
- [ ] Support for multiple image templates/themes
- [ ] Video preview generation for animations
- [ ] Direct social media posting integration
- [ ] Analytics tracking for shared links
