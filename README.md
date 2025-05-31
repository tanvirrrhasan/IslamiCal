# IslamiCal - Islamic Historical Events Calendar

A beautiful and professional web application that displays Islamic historical events based on the current date. The app shows both Gregorian and Hijri dates and uses Google's Gemini AI to provide detailed information about significant historical events in Islamic history.

## Features

- Real-time conversion between Gregorian and Hijri calendars
- Beautiful Islamic-themed UI design
- Integration with Gemini AI for historical event information
- Responsive design for all devices
- Premium animations and transitions
- Arabic font support

## Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/IslamiCal.git
cd IslamiCal
```

2. Get your Gemini API Key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Replace `YOUR_GEMINI_API_KEY` in `app.js` with your actual API key

3. Serve the application:
   You can use any static file server. For example, with Python:
```bash
python -m http.server 8000
```
Or with Node.js's `http-server`:
```bash
npx http-server
```

4. Open the application in your browser:
   - Visit `http://localhost:8000` (or whatever port your server is using)

## Technologies Used

- HTML5
- CSS3 with modern features
- JavaScript (ES6+)
- TailwindCSS for styling
- Google Fonts (Amiri and Noto Naskh Arabic)
- Gemini AI API

## Security Notes

- Never commit your Gemini API key to version control
- Consider using environment variables for production deployment
- Implement rate limiting for API calls in production

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 