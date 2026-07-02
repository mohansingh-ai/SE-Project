# Backend Architecture Model

TalentAI is designed using a **Serverless Database-Only Architecture**. 

- **Auth Portal**: Managed directly via Firebase Authentication SDK.
- **Data Persistence**: Handled directly in Cloud Firestore, using Firestore client SDK wrapped inside React context.
- **AI Processing**: Gemini API runs directly client-side via secure API requests from `src/gemini.js` with integrated API rate-limiting retries.
- **File Systems**: Uses local browser-based `FileReader` to encode resume uploads to Base64 data URLs, saving them directly into Firestore and bypassing the Google Cloud Storage backend.

This design eliminates the need for maintaining a separate backend Node/Express application, drastically reducing hosting costs and improving scalability.
