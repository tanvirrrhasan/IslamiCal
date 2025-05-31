// Gemini API Key and URL configuration
const GEMINI_API_KEY = 'AIzaSyBTuphRKGsSs5KcepTtQ2pcs1RoEjyFgDc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Language translations
const translations = {
    en: {
        subtitle: "Discover Islamic History Through Time",
        gregorian: "Gregorian Date",
        hijri: "Hijri Date",
        events: "Historical Events on This Day",
        loading: "Discovering historical events...",
        selectDate: "Select Date to Search",
        day: "Day",
        month: "Month",
        year: "Year",
        search: "Search Events",
        noEvents: "No historical events found for this date.",
        backToToday: "Back to Today"
    },
    bn: {
        subtitle: "ইসলামের ইতিহাস আবিষ্কার করুন সময়ের সাথে",
        gregorian: "গ্রেগরিয়ান তারিখ",
        hijri: "হিজরি তারিখ",
        events: "আজকের ঐতিহাসিক ঘটনাবলী",
        loading: "ঐতিহাসিক ঘটনাবলী খুঁজে বের করা হচ্ছে...",
        selectDate: "অনুসন্ধানের জন্য তারিখ নির্বাচন করুন",
        day: "দিন",
        month: "মাস",
        year: "বছর",
        search: "ঘটনাবলী খুঁজুন",
        noEvents: "এই তারিখে কোন ঐতিহাসিক ঘটনা পাওয়া যায়নি।",
        backToToday: "আজকের দিনে ফিরে যান"
    },
    ar: {
        subtitle: "اكتشف التاريخ الإسلامي عبر الزمن",
        gregorian: "التاريخ الميلادي",
        hijri: "التاريخ الهجري",
        events: "الأحداث التاريخية في هذا اليوم",
        loading: "جاري البحث عن الأحداث التاريخية...",
        selectDate: "اختر تاريخ للبحث",
        day: "اليوم",
        month: "الشهر",
        year: "السنة",
        search: "البحث عن الأحداث",
        noEvents: "لم يتم العثور على أحداث تاريخية في هذا التاريخ.",
        backToToday: "العودة إلى اليوم"
    }
};

// Get saved language from localStorage or default to English
let currentLang = localStorage.getItem('selectedLanguage') || 'en';

// Function to update language
function updateLanguage(lang) {
    currentLang = lang;
    // Save selected language to localStorage
    localStorage.setItem('selectedLanguage', lang);
    
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update language button text
    document.querySelector('.current-lang').textContent = 
        lang === 'en' ? 'English' : 
        lang === 'bn' ? 'বাংলা' : 
        'العربية';

    // Update UI with new language
    updateUI();
}

// Function to format dates
function formatDate(date) {
    return new Intl.DateTimeFormat(currentLang === 'en' ? 'en-US' : 
                                 currentLang === 'bn' ? 'bn-BD' : 
                                 'ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Function to convert Gregorian to Hijri date
function convertToHijri(date) {
    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        calendar: 'islamic'
    };

    // Format based on selected language
    let formattedDate;
    if (currentLang === 'en') {
        formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    } else if (currentLang === 'bn') {
        formattedDate = new Intl.DateTimeFormat('bn-BD', options).format(date);
    } else {
        formattedDate = new Intl.DateTimeFormat('ar-SA', options).format(date);
    }

    // Remove era text (যুগ) from Bengali date
    if (currentLang === 'bn') {
        formattedDate = formattedDate.replace(' যুগ', '');
    }

    return formattedDate;
}

// Function to create event cards
function createEventCard(event) {
    return `
        <div class="event-card">
            <h3 class="text-xl font-bold text-emerald-400 mb-2">${event.year}</h3>
            <h4 class="text-lg font-semibold text-emerald-400 mb-2">${event.event}</h4>
            <p class="text-gray-300">${event.description}</p>
        </div>
    `;
}

// Function to get historical events from Gemini AI
async function getHistoricalEvents(gregorianDate, hijriDate) {
    const prompt = `You are an expert in Islamic history. Given today's date:
    Gregorian: ${gregorianDate}
    Hijri: ${hijriDate}

    Please provide exactly 3 significant historical events from Islamic history that occurred on this EXACT date (same day and month) in different years. 
    If you cannot find events on the exact date, you may include events from the same Hijri month and day.

    For each event:
    1. The year must be accurate
    2. The event must be historically verified
    3. The description should be concise but informative
    4. Focus on major events that had significant impact on Islamic history

    Format the response as a JSON array with objects containing:
    - year: The Hijri year of the event
    - event: A brief title of the event
    - description: A detailed description of the event and its significance

    Please provide the response in ${currentLang === 'en' ? 'English' : 
                                  currentLang === 'bn' ? 'Bengali' : 
                                  'Arabic'}.`;

    try {
        console.log('Sending request to Gemini API...');
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (!response.ok) {
            throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            const text = data.candidates[0].content.parts[0].text;
            console.log('Parsed text:', text);
            try {
                // Clean the text by removing any markdown code block indicators
                const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
                const events = JSON.parse(cleanText);
                if (Array.isArray(events) && events.length > 0) {
                    return events;
                } else {
                    throw new Error('No events found in the response');
                }
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                return [{
                    year: 'Unknown',
                    event: 'Historical Event',
                    description: text
                }];
            }
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('Error fetching historical events:', error);
        return [{
            year: 'Error',
            event: 'Unable to fetch events',
            description: 'Please try again later. Error: ' + error.message
        }];
    }
}

// Function to update the UI
async function updateUI() {
    const today = new Date();
    const gregorianDate = formatDate(today);
    const hijriDate = convertToHijri(today);

    // Update date displays
    document.getElementById('gregorian-date').textContent = gregorianDate;
    document.getElementById('hijri-date').textContent = hijriDate;

    // Show loading spinner
    document.getElementById('events-container').innerHTML = `
        <div class="loading-spinner text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
            <p class="mt-4 text-emerald-300">${translations[currentLang].loading}</p>
        </div>
    `;

    try {
        const events = await getHistoricalEvents(gregorianDate, hijriDate);
        const eventsHTML = events.map(createEventCard).join('');
        document.getElementById('events-container').innerHTML = eventsHTML;
    } catch (error) {
        document.getElementById('events-container').innerHTML = `
            <div class="text-center text-red-500">
                <p>Error loading historical events. Please try again later.</p>
            </div>
        `;
    }
}

// Function to populate date selectors
function populateDateSelectors() {
    const daySelect = document.getElementById('searchDay');
    const monthSelect = document.getElementById('searchMonth');
    const yearSelect = document.getElementById('searchYear');

    // Populate days (1-31)
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }

    // Populate months
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    // Populate years (current year - 1500 to current year + 100)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 1500; year <= currentYear + 100; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Set current date as default
    const today = new Date();
    daySelect.value = today.getDate();
    monthSelect.value = today.getMonth() + 1;
    yearSelect.value = today.getFullYear();
}

// Function to search events for selected date
async function searchEvents() {
    const day = document.getElementById('searchDay').value;
    const month = document.getElementById('searchMonth').value;
    const year = document.getElementById('searchYear').value;

    const selectedDate = new Date(year, month - 1, day);
    const gregorianDate = formatDate(selectedDate);
    const hijriDate = convertToHijri(selectedDate);

    // Update date displays
    document.getElementById('gregorian-date').textContent = gregorianDate;
    document.getElementById('hijri-date').textContent = hijriDate;

    // Show/hide "Back to Today" button
    const today = new Date();
    const backToTodayButton = document.getElementById('backToTodayButton');
    if (selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate()) {
        backToTodayButton.classList.add('hidden');
    } else {
        backToTodayButton.classList.remove('hidden');
    }

    // Show loading spinner
    document.getElementById('events-container').innerHTML = `
        <div class="loading-spinner text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
            <p class="mt-4 text-emerald-300">${translations[currentLang].loading}</p>
        </div>
    `;

    try {
        const events = await getHistoricalEvents(gregorianDate, hijriDate);
        if (events.length === 0) {
            document.getElementById('events-container').innerHTML = `
                <div class="text-center text-gray-400">
                    <p>${translations[currentLang].noEvents}</p>
                </div>
            `;
        } else {
            const eventsHTML = events.map(createEventCard).join('');
            document.getElementById('events-container').innerHTML = eventsHTML;
        }
    } catch (error) {
        document.getElementById('events-container').innerHTML = `
            <div class="text-center text-red-500">
                <p>Error loading historical events. Please try again later.</p>
            </div>
        `;
    }
}

// Function to update date display
function updateDateDisplay() {
    const day = document.getElementById('searchDay').value;
    const month = document.getElementById('searchMonth').value;
    const year = document.getElementById('searchYear').value;

    if (!day || !month || !year) return;

    const date = new Date(year, month - 1, day);
    const hijriDate = convertToHijri(date);
    
    // Format Gregorian date
    const gregorianOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const gregorianFormatted = date.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', gregorianOptions);
    document.getElementById('gregorian-date').textContent = gregorianFormatted;
    
    // Format Hijri date
    const hijriParts = hijriDate.split(', ');
    const hijriDay = hijriParts[0];
    const hijriMonth = hijriParts[1];
    const hijriYear = hijriParts[2].replace(' যুগ', ''); // Remove যুগ
    
    // Get Arabic day name
    const arabicDays = {
        'Sunday': 'الأحد',
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت'
    };
    
    const dayName = arabicDays[date.toLocaleDateString('en-US', { weekday: 'long' })];
    
    // Combine parts with Arabic day name
    const hijriFormatted = `${dayName}, ${hijriDay}, ${hijriMonth}, ${hijriYear}`;
    document.getElementById('hijri-date').textContent = hijriFormatted;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set initial language from localStorage
    updateLanguage(currentLang);

    // Populate date selectors
    populateDateSelectors();

    // Language selector functionality
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    langBtn.addEventListener('click', () => {
        langDropdown.classList.toggle('hidden');
    });

    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            updateLanguage(lang);
            langDropdown.classList.add('hidden');
        });
    });

    // Search button functionality
    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', searchEvents);

    // "Back to Today" button functionality
    const backToTodayButton = document.getElementById('backToTodayButton');
    backToTodayButton.addEventListener('click', () => {
        const today = new Date();
        document.getElementById('searchDay').value = today.getDate();
        document.getElementById('searchMonth').value = today.getMonth() + 1;
        document.getElementById('searchYear').value = today.getFullYear();
        searchEvents(); // This will also hide the button as dates match
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
            langDropdown.classList.add('hidden');
        }
    });

    // Initial search for current date
    searchEvents();
}); 