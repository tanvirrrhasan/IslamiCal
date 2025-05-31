// Language translations
const translations = {
    en: {
        subtitle: "Convert between Gregorian and Hijri dates",
        gregorianToHijri: "Gregorian to Hijri",
        hijriToGregorian: "Hijri to Gregorian",
        day: "Day",
        month: "Month",
        year: "Year",
        convert: "Convert",
        noEvents: "No historical events found for this date."
    },
    bn: {
        subtitle: "গ্রেগরিয়ান এবং হিজরি তারিখের মধ্যে রূপান্তর করুন",
        gregorianToHijri: "গ্রেগরিয়ান থেকে হিজরি",
        hijriToGregorian: "হিজরি থেকে গ্রেগরিয়ান",
        day: "দিন",
        month: "মাস",
        year: "বছর",
        convert: "রূপান্তর করুন",
        noEvents: "এই তারিখে কোন ঐতিহাসিক ঘটনা পাওয়া যায়নি।"
    },
    ar: {
        subtitle: "تحويل بين التواريخ الميلادية والهجرية",
        gregorianToHijri: "من الميلادي إلى الهجري",
        hijriToGregorian: "من الهجري إلى الميلادي",
        day: "اليوم",
        month: "الشهر",
        year: "السنة",
        convert: "تحويل",
        noEvents: "لم يتم العثور على أحداث تاريخية في هذا التاريخ."
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
}

// Helper function to get numeric Hijri parts from a Gregorian Date object
function getHijriPartsFromGregorian(gregorianDate) {
    if (!(gregorianDate instanceof Date) || isNaN(gregorianDate)) {
        // console.error("Invalid Gregorian date provided to getHijriPartsFromGregorian:", gregorianDate);
        return null;
    }
    // Use 'islamic' calendar. 'en-US-u-nu-latn' ensures Latin numerals for parsing and numeric month.
    // timeZone: 'UTC' is critical for consistent conversion during the bisection search.
    const options = { day: 'numeric', month: 'numeric', year: 'numeric', calendar: 'islamic', timeZone: 'UTC' };
    const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', options);
    try {
        const parts = formatter.formatToParts(gregorianDate);
        let hDay, hMonth, hYear;
        for (const part of parts) {
            if (part.type === 'day') hDay = parseInt(part.value);
            else if (part.type === 'month') hMonth = parseInt(part.value);
            else if (part.type === 'year') hYear = parseInt(part.value);
        }
        if (isNaN(hDay) || isNaN(hMonth) || isNaN(hYear)) {
            // console.error("Failed to parse all Hijri parts from:", parts);
            return null;
        }
        return { hDay, hMonth, hYear };
    } catch (e) {
        // console.error("Error formatting to Hijri parts:", e, "for date:", gregorianDate);
        return null;
    }
}

// Helper function to compare two Hijri dates (year, month, day)
function compareHijriDates(h1_year, h1_month, h1_day, h2_year, h2_month, h2_day) {
    if (h1_year < h2_year) return -1; // h1 is before h2
    if (h1_year > h2_year) return 1;  // h1 is after h2
    // Years are equal
    if (h1_month < h2_month) return -1;
    if (h1_month > h2_month) return 1;
    // Years and months are equal
    if (h1_day < h2_day) return -1;
    if (h1_day > h2_day) return 1;
    return 0; // Dates are equal
}

// Function to convert Gregorian to Hijri date
function convertToHijri(date) {
    console.log(`convertToHijri called. currentLang: ${currentLang}`); // Debug: Check currentLang
    const baseOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        calendar: 'islamic',
        timeZone: 'UTC' // Ensure conversion is based on UTC moment
    };

    if (currentLang === 'en') {
        const enOptions = { ...baseOptions, era: 'short' };
        console.log('Using English options:', enOptions); // Debug: Check English options
        return new Intl.DateTimeFormat('en-US-u-nu-latn', enOptions).format(date);
    } else if (currentLang === 'bn') {
        // For Bengali, do not request the era to avoid "যুগ" and use default numerals.
        console.log('Using Bengali options (baseOptions):', baseOptions); // Debug: Check Bengali options
        let formattedDate = new Intl.DateTimeFormat('bn-BD', baseOptions).format(date);
        // Manually remove " যুগ" and "যুগ" (with potential leading/trailing spaces)
        formattedDate = formattedDate.replace(/\s*যুগ\s*/g, '').trim(); 
        return formattedDate;
    } else { // Arabic
        const arOptions = { ...baseOptions, era: 'short' };
        console.log('Using Arabic options:', arOptions); // Debug: Check Arabic options
        return new Intl.DateTimeFormat('ar-SA-u-nu-latn', arOptions).format(date);
    }
}

// Function to convert Hijri to Gregorian date using bisection search
function convertHijriToGregorian(targetHijriYearStr, targetHijriMonthStr, targetHijriDayStr) {
    const targetHijriYear = parseInt(targetHijriYearStr);
    const targetHijriMonth = parseInt(targetHijriMonthStr);
    const targetHijriDay = parseInt(targetHijriDayStr);

    if (isNaN(targetHijriYear) || isNaN(targetHijriMonth) || isNaN(targetHijriDay)) {
        return "Invalid Hijri date input";
    }

    // Estimate Gregorian year. Formula: G_AD = H_AH × 0.970224 + 621.5774
    // More robust: G_year_approx = H_year - H_year/33 + 622
    const estimatedGregorianYear = Math.floor(targetHijriYear - targetHijriYear / 33 + 622);

    // Define search window for Gregorian dates (e.g., estimatedGregorianYear +/- 2 years)
    // Dates are constructed in UTC to avoid local timezone issues during bisection.
    let lowGregorian = new Date(Date.UTC(estimatedGregorianYear - 2, 0, 1)); // Month is 0-indexed
    let highGregorian = new Date(Date.UTC(estimatedGregorianYear + 2, 11, 31));

    let resultGregorianDate = null;
    const MAX_ITERATIONS = 30; // Max iterations for bisection search

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const lowTime = lowGregorian.getTime();
        const highTime = highGregorian.getTime();

        if (lowTime > highTime) { // Should not happen if logic is correct
            // console.error("Bisection search range invalid: lowTime > highTime");
            break;
        }
        
        // Calculate midpoint, ensuring it's a valid date
        const midTimestamp = lowTime + (highTime - lowTime) / 2;
        let midGregorian = new Date(midTimestamp);
        
        // Ensure midGregorian is at the start of its day UTC for consistent Hijri conversion
        // This snaps the time to 00:00:00.000 UTC for that day.
        midGregorian = new Date(Date.UTC(midGregorian.getUTCFullYear(), midGregorian.getUTCMonth(), midGregorian.getUTCDate()));

        const currentHijriParts = getHijriPartsFromGregorian(midGregorian);

        if (!currentHijriParts) {
            // console.error("Failed to get Hijri parts for midGregorianDate:", midGregorian);
            // This can happen if midGregorian is an invalid date or at edge cases of daylight saving for non-UTC dates,
            // but using Date.UTC and getHijriPartsFromGregorian with timeZone:'UTC' should mitigate this.
            // If it still occurs, the algorithm might need adjustment or the input Hijri date is problematic.
            // For now, we try to adjust the range slightly. If mid is closer to low, try advancing low.
             if ( (midGregorian.getTime() - lowGregorian.getTime()) < (highGregorian.getTime() - midGregorian.getTime()) ) {
                lowGregorian.setUTCDate(lowGregorian.getUTCDate() + 1); // Advance low
            } else {
                highGregorian.setUTCDate(highGregorian.getUTCDate() -1); // Regress high
            }
            if (lowGregorian.getTime() >= highGregorian.getTime()) break; // Stop if range inverted
            continue; // Skip to next iteration
        }

        const comparison = compareHijriDates(
            currentHijriParts.hYear, currentHijriParts.hMonth, currentHijriParts.hDay,
            targetHijriYear, targetHijriMonth, targetHijriDay
        );

        if (comparison === 0) {
            resultGregorianDate = midGregorian;
            break;
        } else if (comparison < 0) { // currentHijri is before targetHijri
            lowGregorian = new Date(midGregorian.getTime() + 24 * 60 * 60 * 1000); // mid + 1 day
        } else { // currentHijri is after targetHijri
            highGregorian = new Date(midGregorian.getTime() - 24 * 60 * 60 * 1000); // mid - 1 day
        }
        
        // If range collapses
        if (lowGregorian.getTime() > highGregorian.getTime()) {
             // Check boundaries if no exact match yet and range collapsed
            const lastLowHijri = getHijriPartsFromGregorian(lowGregorian);
            if (lastLowHijri && compareHijriDates(lastLowHijri.hYear, lastLowHijri.hMonth, lastLowHijri.hDay, targetHijriYear, targetHijriMonth, targetHijriDay) === 0) {
                resultGregorianDate = lowGregorian; break;
            }
            const lastHighHijri = getHijriPartsFromGregorian(highGregorian);
            if (lastHighHijri && compareHijriDates(lastHighHijri.hYear, lastHighHijri.hMonth, lastHighHijri.hDay, targetHijriYear, targetHijriMonth, targetHijriDay) === 0) {
                resultGregorianDate = highGregorian; break;
            }
            break;
        }
    }
    
    // Final check using the day before lowGregorian if no result found yet (covers some edge cases)
    if (!resultGregorianDate && lowGregorian.getTime() <= highGregorian.getTime()) {
        const dayBeforeLow = new Date(lowGregorian.getTime());
        dayBeforeLow.setUTCDate(dayBeforeLow.getUTCDate() -1);
        const prevDayHijri = getHijriPartsFromGregorian(dayBeforeLow);
         if (prevDayHijri && compareHijriDates(prevDayHijri.hYear, prevDayHijri.hMonth, prevDayHijri.hDay, targetHijriYear, targetHijriMonth, targetHijriDay) === 0) {
            resultGregorianDate = dayBeforeLow;
        }
    }


    if (resultGregorianDate) {
        const displayOptions = {
            day: 'numeric', month: 'long', year: 'numeric'
            // No timeZone specified, so it uses local time for display.
            // The resultGregorianDate is a UTC date (midnight). Formatting will show it in local TZ.
        };
        
        let localeForDisplay;
        if (currentLang === 'en') {
            localeForDisplay = 'en-US';
        } else if (currentLang === 'bn') {
            localeForDisplay = 'bn-BD';
        } else { // Default to 'ar'
            localeForDisplay = 'ar-SA';
        }
        return new Intl.DateTimeFormat(localeForDisplay, displayOptions).format(resultGregorianDate);
    } else {
        // console.error("Hijri to Gregorian conversion failed for:", targetHijriYear, targetHijriMonth, targetHijriDay);
        return "Conversion not found"; // Error message
    }
}

// Function to create year dropdown
function createYearDropdown(inputId, minYear, maxYear) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(inputId + 'Btn');
    let dropdownElement = null; // Holds the currently open dropdown for this instance
    let closeOnClickOutsideHandler = null; // Holds the click-outside handler for cleanup

    // Helper function to close the dropdown and clean up listeners
    const closeDropdown = () => {
        if (dropdownElement) {
            dropdownElement.remove();
            dropdownElement = null;
        }
        if (closeOnClickOutsideHandler) {
            document.removeEventListener('click', closeOnClickOutsideHandler, true);
            closeOnClickOutsideHandler = null;
        }
    };

    if (input && btn) {
        btn.addEventListener('click', () => {
            if (dropdownElement) { // If this specific dropdown is already open, close it
                closeDropdown();
                return;
            }

            // Create dropdown element
            dropdownElement = document.createElement('div');
            dropdownElement.className = 'absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto year-dropdown-list';
            dropdownElement.style.top = '100%'; // Position below the input/button container
            dropdownElement.style.left = '0';

            let selectedOptionElement = null;
            const currentYearInInput = input.value ? parseInt(input.value) : null;

            // Populate years in reverse chronological order
            for (let year = maxYear; year >= minYear; year--) {
                const yearOption = document.createElement('div');
                yearOption.className = 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-gray-100';
                yearOption.textContent = year;
                yearOption.addEventListener('click', () => {
                    input.value = year;
                    closeDropdown(); // Close after selection
                });
                dropdownElement.appendChild(yearOption);

                if (year === currentYearInInput) {
                    selectedOptionElement = yearOption;
                    // Add classes to visually highlight the selected year
                    yearOption.classList.add('bg-emerald-600', 'font-semibold');
                }
            }

            input.parentElement.appendChild(dropdownElement);

            // Scroll to the selected year if it exists
            if (selectedOptionElement) {
                // Defer scrollIntoView slightly to ensure DOM is fully updated
                setTimeout(() => {
                    if (dropdownElement && selectedOptionElement.isConnected) {
                        selectedOptionElement.scrollIntoView({ block: 'center', behavior: 'auto' });
                    }
                }, 0);
            }

            // Define the handler for closing when clicking outside
            closeOnClickOutsideHandler = (e) => {
                // Close if click is outside the dropdown AND not on the button that opened it
                if (dropdownElement && !dropdownElement.contains(e.target) && e.target !== btn) {
                    closeDropdown();
                }
            };

            // Add the click-outside listener after a short delay
            setTimeout(() => {
                if (dropdownElement) { // Ensure dropdown wasn't closed immediately by another action
                    document.addEventListener('click', closeOnClickOutsideHandler, true);
                }
            }, 0);
        });
    }
}

// Function to populate date selectors
function populateDateSelectors() {
    console.log('Populating date selectors...');
    
    // Populate Gregorian days (1-31)
    const gregorianDaySelect = document.getElementById('gregorianDay');
    if (gregorianDaySelect) {
        gregorianDaySelect.innerHTML = ''; // Clear existing options
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            gregorianDaySelect.appendChild(option);
        }
    }

    // Populate Hijri days (1-30)
    const hijriDaySelect = document.getElementById('hijriDay');
    if (hijriDaySelect) {
        hijriDaySelect.innerHTML = ''; // Clear existing options
        for (let i = 1; i <= 30; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            hijriDaySelect.appendChild(option);
        }
    }

    // Create year dropdowns
    createYearDropdown('gregorianYear', 1900, 2100);
    createYearDropdown('hijriYear', 1300, 1500);

    // Set current date as default in Gregorian converter
    const today = new Date();
    if (gregorianDaySelect) gregorianDaySelect.value = today.getDate();
    const gregorianMonthSelect = document.getElementById('gregorianMonth');
    if (gregorianMonthSelect) gregorianMonthSelect.value = today.getMonth() + 1;
    const gregorianYearInput = document.getElementById('gregorianYear');
    if (gregorianYearInput) gregorianYearInput.value = today.getFullYear();

    // Set current Hijri date as default in Hijri converter
    const hijriOptions = {
        day: 'numeric',
        month: 'numeric', // Get month as a number
        year: 'numeric',
        calendar: 'islamic'
    };

    let localeForFormatter;
    if (currentLang === 'en') {
        localeForFormatter = 'en-US';
    } else if (currentLang === 'bn') {
        localeForFormatter = 'bn-BD';
    } else { // Default to 'ar'
        localeForFormatter = 'ar-SA';
    }

    // Force Latin numerals for parsing day, month, year, and get month as numeric
    const formatter = new Intl.DateTimeFormat(`${localeForFormatter}-u-nu-latn`, hijriOptions);
    
    const parts = formatter.formatToParts(today);
    console.log('Hijri formatToParts (numeric month, latin numerals):', parts);

    let dayValue, numericMonthValue, yearValue;

    for (const part of parts) {
        if (part.type === 'day') dayValue = parseInt(part.value);
        else if (part.type === 'month') numericMonthValue = parseInt(part.value);
        else if (part.type === 'year') yearValue = parseInt(part.value);
    }
    
    console.log('Parsed Hijri Day:', dayValue, 'Month:', numericMonthValue, 'Year:', yearValue);

    // Set Hijri day
    if (hijriDaySelect && dayValue !== undefined) {
        console.log('Setting Hijri day:', dayValue);
        hijriDaySelect.value = dayValue;
    } else {
        console.error('Hijri day not found or hijriDaySelect is null. Day value:', dayValue);
    }

    // Set Hijri month
    const hijriMonthSelect = document.getElementById('hijriMonth');
    if (hijriMonthSelect && numericMonthValue !== undefined) {
        console.log('Setting Hijri month to (numeric):', numericMonthValue);
        hijriMonthSelect.value = numericMonthValue; // Directly use the number
    } else {
        console.error('Hijri numeric month not found or hijriMonthSelect is null. Month value:', numericMonthValue);
    }

    // Set Hijri year
    const hijriYearInput = document.getElementById('hijriYear');
    if (hijriYearInput && yearValue !== undefined) {
        console.log('Setting Hijri year:', yearValue);
        hijriYearInput.value = yearValue;
    } else {
        console.error('Hijri year not found or hijriYearInput is null. Year value:', yearValue);
    }

    console.log('Date selectors populated successfully');
}

// Function to handle Gregorian to Hijri conversion
function handleGregorianToHijri() {
    const day = document.getElementById('gregorianDay').value;
    const month = document.getElementById('gregorianMonth').value;
    const year = document.getElementById('gregorianYear').value;

    if (!day || !month || !year) {
        alert('Please fill in all fields');
        return;
    }

    // Create a Date object representing midnight UTC for the given Gregorian date
    const dateUTC = new Date(Date.UTC(year, parseInt(month) - 1, day));
    
    if (isNaN(dateUTC.getTime())) {
        alert('Invalid Gregorian date entered.');
        return;
    }

    const hijriDate = convertToHijri(dateUTC);
    
    const resultDiv = document.getElementById('hijriResult');
    resultDiv.querySelector('p').textContent = hijriDate;
    resultDiv.classList.remove('hidden');
}

// Function to handle Hijri to Gregorian conversion
function handleHijriToGregorian() {
    const day = document.getElementById('hijriDay').value;
    const month = document.getElementById('hijriMonth').value;
    const year = document.getElementById('hijriYear').value;

    if (!day || !month || !year) {
        alert('Please fill in all fields');
        return;
    }

    const gregorianDate = convertHijriToGregorian(year, month, day);
    
    const resultDiv = document.getElementById('gregorianResult');
    resultDiv.querySelector('p').textContent = gregorianDate;
    resultDiv.classList.remove('hidden');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Set initial language from localStorage
    updateLanguage(currentLang);

    // Populate date selectors
    populateDateSelectors();

    // Language selector functionality
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', () => {
            langDropdown.classList.toggle('hidden');
        });
    }

    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            updateLanguage(lang);
            if (langDropdown) langDropdown.classList.add('hidden');
        });
    });

    // Conversion button event listeners
    const convertToHijriBtn = document.getElementById('convertToHijri');
    const convertToGregorianBtn = document.getElementById('convertToGregorian');

    if (convertToHijriBtn) {
        convertToHijriBtn.addEventListener('click', handleGregorianToHijri);
    }
    if (convertToGregorianBtn) {
        convertToGregorianBtn.addEventListener('click', handleHijriToGregorian);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (langBtn && langDropdown && !langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
            langDropdown.classList.add('hidden');
        }
    });

    console.log('App initialized successfully');
}); 