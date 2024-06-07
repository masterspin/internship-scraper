# Internship Scraper & Manager for SWE/Quant/Business Internships/Co-ops (2024-2025 School Year)

## Overview

This project is a comprehensive solution for scraping and managing internship and co-op listings for the 2024-2025 school year. It focuses on positions in software engineering (SWE), quantitative analysis (Quant), and business domains. The scraper collects listings from LinkedIn, the Pitt CSC & Simplify GitHub repository, and the Ouckah & CSCareers GitHub repository. The platform also incorporates Google OAuth for seamless user management.

Visit the [website (ritij.tech)](https://www.ritij.tech/)

## Features

- **Multi-source scraping**: Collects job listings from LinkedIn, PittCSC GitHub, and Ouckah GitHub.
- **User authentication**: Utilizes Google OAuth for secure and easy user management.
- **Internship management**: Enables users to save, filter, and track internship applications.
- **Responsive design**: Ensures a seamless experience across devices.

## Tech Stack

- **Frontend**: React, TypeScript, Next.js
- **Database**: PostgreSQL, Supabase
- **Scraping Tools**: Beautiful Soup, asyncio, aiohttp
- **Authentication**: Google OAuth 2.0

## Installation

### Prerequisites

- Node.js
- Python
- Supabase account
- Google Cloud project for OAuth

### Steps

1. **Clone the repository:**
    ```bash
    git clone https://github.com/masterspin/internship-scraper.git
    cd internship-scraper
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Setup environment variables:**
    Create a `.env` file in the root directory and add the following variables:
    ```plaintext
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_SERVICE_ROLE_KEY=your_supabase_anon_key
    ```

4. **Run the Python scrapers:**
    Ensure you have Python and the required libraries installed. Then run:
    ```bash
    python3 linkedinScraper.py
    python3 githubScraper.py
    ```

5. **Start the development server:**
    ```bash
    npm run dev
    ```

## Usage

1. **Log in with Google:**
   - Navigate to the homepage.
   - Click on the "Login with Google" button to authenticate.

2. **Scrape internships:**
   - Use the provided options to initiate scraping from LinkedIn, PittCSC GitHub, and Ouckah GitHub.
   - Filter and manage the scraped listings.

3. **Save and track applications:**
   - Keep track of your applications directly on the platform.
   - Add your own interesting job postings.

## Contributing

We welcome contributions from the community! To contribute, follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License.

## Contact

For any inquiries or feedback, please contact us at [ritijcode@gmail.com](mailto:ritijcode@gmail.com).

---

This README provides a comprehensive guide to setting up, using, and contributing to the Internship Scraper & Manager. It also highlights the key features and technologies used in the project, making it easy for users and contributors to get started.
