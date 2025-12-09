# OpenAI ChatGPT Integration Setup

## Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to **API Keys** section (https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Copy the API key (you won't be able to see it again!)

## Step 2: Add API Key to .env File

Add this line to your `.env` file in the root directory:

```
VITE_OPENAI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual OpenAI API key.

**Important:** 
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Keep your API key secret and secure
- The API key will be visible in the browser (for development). In production, use a backend proxy.

## Step 3: Restart Your Dev Server

After adding the API key:
1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again

## Step 4: Test the Integration

1. Open the app in your browser
2. Go to the **AI Assistant** tab
3. You should see "powered by ChatGPT" in the welcome message
4. Ask a question - you should get a real AI response!

## Features

✅ **Real ChatGPT Integration** - Uses OpenAI's GPT-4o-mini model
✅ **Document Context** - AI can reference your uploaded documents
✅ **Project Context** - AI knows about your milestones, phases, and tasks
✅ **Conversation History** - Maintains context across messages
✅ **Fallback Mode** - Works without API key (rule-based responses)

## Model Used

- **Default:** `gpt-4o-mini` (cost-efficient, fast)
- **Alternative:** Can be changed to `gpt-4` or `gpt-3.5-turbo` in `src/lib/openai.ts`

## Cost Considerations

- OpenAI charges per token used
- `gpt-4o-mini` is very affordable (~$0.15 per 1M input tokens)
- Monitor your usage at https://platform.openai.com/usage

## Troubleshooting

### "OpenAI API key not configured" warning
- Make sure you added `VITE_OPENAI_API_KEY` to your `.env` file
- Restart your dev server after adding the key
- Check that the variable name is exactly `VITE_OPENAI_API_KEY`

### API errors
- Verify your API key is correct
- Check your OpenAI account has credits/billing set up
- Check the browser console for detailed error messages

### Rate limits
- Free tier has rate limits
- Upgrade your OpenAI plan if you need higher limits

## Security Note

⚠️ **Important:** The API key is exposed in the browser in this setup. For production:
- Use a backend proxy/API route to hide the key
- Never expose API keys in client-side code
- Consider using environment variables on your server





