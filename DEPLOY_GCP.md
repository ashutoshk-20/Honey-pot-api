# Deploying to Google Cloud Run

Follow these steps to deploy your Scam Detection Honey-Pot to Google Cloud.

## Option 1: Using the Command Line (GCloud CLI)

1. **Initialize GCloud** (if not done):
   ```bash
   gcloud init
   ```

2. **Deploy the application**:
   Run this command from the root folder:
   ```bash
   gcloud run deploy honey-pot-api \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_gemini_key_here,SECRET_API_KEY=honey-pot-secret-2024-hackathon,GUVI_CALLBACK_URL=https://hackathon.guvi.in/api/updateHoneyPotFinalResult"
   ```

## Option 2: Using the Google Cloud Console (Web Interface)

1. **Upload your code** to a GitHub repository.
2. Go to the [Cloud Run Console](https://console.cloud.google.com/run).
3. Click **Create Service**.
4. Select **Continuously deploy from a repository**.
5. Connect your GitHub account and select this repository.
6. In the **Build Configuration**, select **Dockerfile**.
7. In the **Variables & Secrets** tab, add these Environment Variables:
   - `GEMINI_API_KEY`
   - `SECRET_API_KEY`
   - `GUVI_CALLBACK_URL`
8. Set the **Container Port** to `8080`.
9. Click **Create**.

## Important Notes
- **Port**: The application is configured to listen on `process.env.PORT` or `8080`, which is the standard for Google Cloud.
- **Environment Variables**: Do NOT upload your `.env` file to GitHub. Add the variables directly in the Google Cloud Console or via the CLI command above.
- **Timeouts**: Google Cloud Run defaults to a 60-second timeout, which is plenty for Gemini to respond.
